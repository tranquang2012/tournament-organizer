const pool = require('../../../shared/database/pool');
const AppError = require('../../../shared/errors/AppError');
const matchesRepository = require('../repository/matches.repository');

class MatchesService {
  async getMatch(matchId) {
    const m = await matchesRepository.getMatch(matchId);
    if (!m) {
      throw new AppError('Match not found.', 404);
    }
    return this._mapMatchResponse(m);
  }

  async updateMatch(matchId, body) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch current match details
      const currentMatch = await matchesRepository.getMatchBase(matchId, client);
      if (!currentMatch) {
        throw new AppError('Match not found.', 404);
      }

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

      // If winner is not explicitly provided but scores are, determine winner automatically
      if (winning_competitor_id === null && score1 !== null && score2 !== null && !is_draw) {
        if (score1 > score2) {
          winning_competitor_id = currentMatch.competitor1_id;
        } else if (score2 > score1) {
          winning_competitor_id = currentMatch.competitor2_id;
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
      } else if (score1 !== null || score2 !== null) {
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

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // Return the updated match
    return this.getMatch(matchId);
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

    // If both slots are now filled, transition next match from locked to ready
    let nextStatus = nextMatch.status || 'locked';
    if (updatedCompetitor1 !== null && updatedCompetitor2 !== null && nextStatus === 'locked') {
      nextStatus = 'ready';
    }

    await matchesRepository.updateNextMatchSlots(nextMatchId, updatedCompetitor1, updatedCompetitor2, nextStatus, client);
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
      stage: m.stage,
      round: m.round,
      group_name: m.group_name,
      status: m.status,
      competitors,
      scheduled_start: m.scheduled_start,
      scheduled_end: m.scheduled_end,
      results,
      winning_competitor_id: m.winning_competitor_id,
      is_draw: m.is_draw,
      next_winner_match_id: m.next_winner_match_id ? String(m.next_winner_match_id) : null,
      next_loser_match_id: m.next_loser_match_id ? String(m.next_loser_match_id) : null
    };
  }
}

module.exports = new MatchesService();
