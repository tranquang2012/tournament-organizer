const pool = require('../../../shared/database/pool');
const AppError = require('../../../shared/errors/AppError');
const matchesRepository = require('../repository/matches.repository');
const bracketService = require('../../tournament/service/bracket.service');
const {validateScheduleDto} = require('../dto/scheduleMatch.dto');
const { validateResumeDto } = require('../dto/pauseMatch.dto');

class MatchesService {
  async getMatch(matchId) {
    const m = await matchesRepository.getMatch(matchId);
    if (!m) {
      throw new AppError('Match not found.', 404);
    }
    return this._mapMatchResponse(m);
  }

  async updateMatch(matchId, body) {
    let shouldCheckHybridStage = false;
    let tournamentId = null;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch current match details
      const currentMatch = await matchesRepository.getMatchBase(matchId, client);
      if (!currentMatch) {
        throw new AppError('Match not found.', 404);
      }
      tournamentId = currentMatch.tour_id;

      // 2. Parse payload (supporting both flat keys and nested results array with snake_case/camelCase)
      let score1 = body.score1 !== undefined ? body.score1 : null;
      let score2 = body.score2 !== undefined ? body.score2 : null;
      let winning_competitor_id = body.winning_competitor_id !== undefined 
        ? body.winning_competitor_id 
        : (body.winnerId !== undefined ? body.winnerId : null);
      let is_draw = body.is_draw !== undefined 
        ? body.is_draw 
        : (body.isDraw !== undefined ? body.isDraw : false);

      if (Array.isArray(body.results)) {
        for (const r of body.results) {
          const rCompId = r.comp_id !== undefined ? r.comp_id : r.competitorId;
          if (rCompId === currentMatch.competitor1_id) {
            score1 = r.score;
          } else if (rCompId === currentMatch.competitor2_id) {
            score2 = r.score;
          }
        }
      }

      // Determine old winner and loser
      const oldWinnerId = currentMatch.winning_competitor_id;
      let oldLoserId = null;
      if (oldWinnerId) {
        oldLoserId = oldWinnerId === currentMatch.competitor1_id ? currentMatch.competitor2_id : currentMatch.competitor1_id;
      }

      // Determine new winner and loser
      const newWinnerId = winning_competitor_id;
      let newLoserId = null;
      if (newWinnerId) {
        newLoserId = newWinnerId === currentMatch.competitor1_id ? currentMatch.competitor2_id : currentMatch.competitor1_id;
      }

      // Determine result status strings
      let result1 = null;
      let result2 = null;
      if (newWinnerId) {
        result1 = newWinnerId === currentMatch.competitor1_id ? 'win' : 'loss';
        result2 = newWinnerId === currentMatch.competitor2_id ? 'win' : 'loss';
      } else if (is_draw) {
        result1 = 'draw';
        result2 = 'draw';
      }

      // Determine new match status
      let newStatus = currentMatch.status || 'locked';
      if (newWinnerId) {
        newStatus = 'completed';
      } else if (is_draw) {
        newStatus = 'completed';
      } else if (score1 !== null || score2 !== null || body.status === 'running') {
        newStatus = 'running';
      }

      // 3. Update current match in DB
      await matchesRepository.updateMatch(matchId, {
        score1,
        score2,
        winning_competitor_id: newWinnerId,
        result1,
        result2,
        is_draw,
        status: newStatus
      }, client);

      // 4. Propagate winner to next winner match if specified
      if (newWinnerId) {
        await this._propagateCompetitor(client, matchId, oldWinnerId, newWinnerId, 'winner');
      }

      // 5. Propagate loser to next loser match if specified (double elimination)
      if (newLoserId) {
        await this._propagateCompetitor(client, matchId, oldLoserId, newLoserId, 'loser');
      }

      shouldCheckHybridStage = newStatus === 'completed';

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    if (shouldCheckHybridStage && tournamentId) {
      await bracketService.ensureHybridStageTwoGenerated(tournamentId);
    }

    // Return the updated match
    return this.getMatch(matchId);
  }

  async scheduleMatch(matchId, body) {
  // 1. Validate input
  const { data, errors } = validateScheduleDto(body);
  if (errors) throw new AppError(errors.join(' | '), 400);

  // 2. Fetch match to confirm it exists and get tour_id
  const current = await matchesRepository.getMatchBase(matchId);
  if (!current) throw new AppError('Match not found.', 404);

  // 3. Guard: cannot schedule a completed or archived match
  if (['completed', 'archived', 'bye'].includes(current.status)) {
    throw new AppError(`Cannot schedule a match with status '${current.status}'.`, 400);
  }

  // 4. Check for overlapping matches in the same tournament (warn, not block)
  const conflicts = await matchesRepository.getScheduleConflicts(
    current.tour_id,
    data.scheduled_start,
    data.scheduled_end,
    matchId
  );

  // 5. Save schedule
  const updated = await matchesRepository.updateSchedule(
    matchId,
    data.scheduled_start,
    data.scheduled_end
  );

  if (!updated) throw new AppError('Failed to update schedule.', 500);

  return {
    match_id:        String(updated.match_id),
    scheduled_start: updated.scheduled_start,
    scheduled_end:   updated.scheduled_end,
    status:          updated.status,
    conflicts: conflicts.length > 0
      ? conflicts.map(c => ({
          match_id:        String(c.match_id),
          round:           c.round,
          stage:           c.stage,
          group_name:      c.group_name,
          scheduled_start: c.scheduled_start,
          scheduled_end:   c.scheduled_end,
        }))
      : [],
    conflict_warning: conflicts.length > 0
      ? `${conflicts.length} other match(es) overlap this time window.`
      : null,
  };
}

//Start match

async startMatch(matchId) {
  const match = await matchesRepository.getMatchTiming(matchId);
  if (!match) throw new AppError('Match not found.', 404);

  //only 'ready' matches can be started
  if (!['ready', 'waiting'].includes(match.status)) {
    if (match.status === 'running') {
      throw new AppError('Match is already running.', 400);
    }
    if (match.status === 'paused') {
      throw new AppError("Match is paused. Use the resume endpoint to continue.", 400);
    }
    if (match.status === 'completed') {
      throw new AppError('Match is already completed.', 400);
    }
    throw new AppError(`Cannot start a match with status '${match.status}'.`, 400);
  }

  //cannot start before scheduled_start time
  if (match.scheduled_start) {
    const now       = new Date();
    const startTime = new Date(match.scheduled_start);

    if (now < startTime) {
      const diffMinutes = Math.ceil((startTime - now) / (1000 * 60));
      throw new AppError(
        `Match is scheduled to start at ${startTime.toISOString()}. ` +
        `It is still ${diffMinutes} minute(s) away. ` +
        `Please adjust the scheduled start time if you want to begin earlier.`,
        400
      );
    }
  }

  const updated = await matchesRepository.startMatch(matchId);
  if (!updated) throw new AppError('Failed to start match.', 500);

  return {
    match_id:        String(updated.match_id),
    status:          updated.status,
    scheduled_start: updated.scheduled_start,
    scheduled_end:   updated.scheduled_end,
    message:         'Match has started successfully.',
  };
}

//Pause match

async pauseMatch(matchId) {
  const match = await matchesRepository.getMatchTiming(matchId);
  if (!match) throw new AppError('Match not found.', 404);

  //only running matches can be paused
  if (match.status !== 'running') {
    if (match.status === 'paused') {
      throw new AppError('Match is already paused.', 400);
    }
    if (match.status === 'completed') {
      throw new AppError('Cannot pause a completed match.', 400);
    }
    throw new AppError(`Cannot pause a match with status '${match.status}'.`, 400);
  }

  const pausedAt = new Date().toISOString();
  const updated  = await matchesRepository.pauseMatch(matchId, pausedAt);
  if (!updated) throw new AppError('Failed to pause match.', 500);

  return {
    match_id:        String(updated.match_id),
    status:          updated.status,
    scheduled_start: updated.scheduled_start,
    scheduled_end:   updated.scheduled_end,
    paused_at:       updated.tour_pausedate,
    message:         'Match has been paused. Press resume and provide a new end time to continue.',
  };
}

//Resume match

async resumeMatch(matchId, body) {
  // 1. Validate new scheduled_end from popup input
  const { data, errors } = validateResumeDto(body);
  if (errors) throw new AppError(errors.join(' | '), 400);

  const match = await matchesRepository.getMatchTiming(matchId);
  if (!match) throw new AppError('Match not found.', 404);

  //only paused matches can be resumed
  if (match.status !== 'paused') {
    if (match.status === 'running') {
      throw new AppError('Match is already running, no need to resume.', 400);
    }
    if (match.status === 'completed') {
      throw new AppError('Cannot resume a completed match.', 400);
    }
    throw new AppError(`Cannot resume a match with status '${match.status}'.`, 400);
  }

  //new end time must be in the future
  const now    = new Date();
  const newEnd = new Date(data.scheduled_end);
  if (newEnd <= now) {
    throw new AppError(
      'The new scheduled_end must be a future datetime.',
      400
    );
  }

  //new end must also be after scheduled_start
  if (match.scheduled_start) {
    const startTime = new Date(match.scheduled_start);
    if (newEnd <= startTime) {
      throw new AppError(
        'The new scheduled_end must be after the match scheduled_start.',
        400
      );
    }
  }

  const updated = await matchesRepository.resumeMatch(matchId, data.scheduled_end);
  if (!updated) throw new AppError('Failed to resume match.', 500);

  return {
    match_id:        String(updated.match_id),
    status:          updated.status,
    scheduled_start: updated.scheduled_start,
    scheduled_end:   updated.scheduled_end,
    paused_at:       null,
    message:         `Match has resumed. New end time: ${updated.scheduled_end}.`,
  };
}

  async _propagateCompetitor(client, matchId, oldCompId, newCompId, pathType) {
    const nextRefs = await matchesRepository.getNextMatchRef(matchId, client);
    if (!nextRefs) return;

    const matchField = pathType === 'winner' ? 'next_winner_match_id' : 'next_loser_match_id';
    const nextMatchId = nextRefs[matchField];
    if (!nextMatchId) return;

    const nextMatch = await matchesRepository.getNextMatchBase(nextMatchId, client);
    if (!nextMatch) return;

    let updatedCompetitor1 = nextMatch.competitor1_id;
    let updatedCompetitor2 = nextMatch.competitor2_id;

    // Case A: Replacing an old competitor (score correction)
    if (oldCompId && (updatedCompetitor1 === oldCompId || updatedCompetitor2 === oldCompId)) {
      if (updatedCompetitor1 === oldCompId) {
        updatedCompetitor1 = newCompId;
      } else {
        updatedCompetitor2 = newCompId;
      }
    } 
    // Case B: Seeding a new competitor
    else {
      if (updatedCompetitor1 !== newCompId && updatedCompetitor2 !== newCompId) {
        if (updatedCompetitor1 === null) {
          updatedCompetitor1 = newCompId;
        } else if (updatedCompetitor2 === null) {
          updatedCompetitor2 = newCompId;
        } else {
          updatedCompetitor1 = newCompId;
        }
      }
    }

    // Update status based on participant presence
    let nextStatus = nextMatch.status || 'locked';
    if (updatedCompetitor1 !== null && updatedCompetitor2 !== null) {
      if (nextStatus === 'locked' || nextStatus === 'waiting') {
        nextStatus = 'ready';
      }
    } else if (updatedCompetitor1 !== null || updatedCompetitor2 !== null) {
      if (nextStatus === 'locked') {
        nextStatus = 'waiting';
      }
    } else {
      nextStatus = 'locked';
    }

    let winningCompetitorId = nextMatch.winning_competitor_id;
    if (nextStatus === 'bye') {
      winningCompetitorId = newCompId;
    }

    await matchesRepository.updateNextMatchSlots(nextMatchId, updatedCompetitor1, updatedCompetitor2, nextStatus, winningCompetitorId, client);

    // If next match is a BYE, recursively propagate the winner to the subsequent round immediately!
    if (nextStatus === 'bye' && winningCompetitorId) {
      await this._propagateCompetitor(client, nextMatchId, oldCompId, winningCompetitorId, 'winner');
    }
  }

  _mapMatchResponse(m) {
    const competitors = [];
    const results = [];

    if (m.competitor1_id) {
      competitors.push({
        comp_id: m.competitor1_id,
        comp_name: m.c1_name,
        comp_logo: m.c1_logo,
        comp_size: m.c1_size
      });
      results.push({
        comp_id: m.competitor1_id,
        score: m.score1 || 0
      });
    }

    if (m.competitor2_id) {
      competitors.push({
        comp_id: m.competitor2_id,
        comp_name: m.c2_name,
        comp_logo: m.c2_logo,
        comp_size: m.c2_size
      });
      results.push({
        comp_id: m.competitor2_id,
        score: m.score2 || 0
      });
    }

    return {
      match_id: String(m.match_id),
      tour_id: m.tour_id ? String(m.tour_id) : null,
      tour_name: m.tour_name || null,
      tour_banner: m.tour_banner || null,
      tour_format: m.tour_format || null,
      participant_type: m.participant_type || null,
      stage: m.stage,
      round: m.round,
      group_name: m.group_name,
      status: m.status,
      competitors,
      scheduled_start: m.scheduled_start,
      scheduled_end: m.scheduled_end,
      results,
      round_scores: m.round_scores || null,
      winning_competitor_id: m.winning_competitor_id,
      is_draw: m.is_draw,
      next_winner_match_id: m.next_winner_match_id ? String(m.next_winner_match_id) : null,
      next_loser_match_id: m.next_loser_match_id ? String(m.next_loser_match_id) : null
    };
  }
}

module.exports = new MatchesService();
