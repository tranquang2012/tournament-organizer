const { InMemoryDatabase } = require('brackets-memory-db');
const { BracketsManager } = require('brackets-manager');
const pool = require('../../../shared/database/pool');
const AppError = require('../../../shared/errors/AppError');
const bracketRepository = require('../repository/bracket.repository');

class BracketService {
  async generateBracket(tourId) {
    // 1. Get tournament details
    const tournament = await bracketRepository.getTournamentFormat(tourId);
    if (!tournament) {
      throw new AppError('Tournament not found.', 404);
    }

    const format = tournament.tour_format;
    if (format === 'round_scoring') {
      return this.generateRoundScoringBracket(tourId, tournament);
    }
    if (!['single_elimination', 'double_elimination', 'round_robin'].includes(format)) {
      throw new AppError(`Format '${format}' does not support standard bracket generation.`, 400);
    }

    // 2. Get competitors
    const competitors = await bracketRepository.getCompetitorsForSeeding(tourId);
    if (competitors.length < 2) {
      throw new AppError('At least 2 competitors are required to generate matches.', 400);
    }

    const seeding = competitors.map(c => c.comp_id);

    // 3. Initialize brackets-manager in memory
    const db = new InMemoryDatabase();
    const manager = new BracketsManager(db);

    // 4. Determine stage size (elimination formats require a power of two)
    let stageSize = seeding.length;
    if (format === 'single_elimination' || format === 'double_elimination') {
      stageSize = Math.pow(2, Math.ceil(Math.log2(seeding.length)));
      if (stageSize < 2) stageSize = 2;
    }

    // 5. Build settings
    const settings = {
      size: stageSize,
    };

    if (format === 'double_elimination') {
      settings.grandFinal = 'single';
    } else if (format === 'single_elimination') {
      settings.consolationFinal = true;
    } else if (format === 'round_robin') {
      settings.groupCount = tournament.group_count || 1;
    }

    // 6. Create stage in memory
    await manager.create.stage({
      tournamentId: 1, // Dummy ID in-memory
      name: 'Bracket Stage',
      type: format,
      seeding,
      settings
    });

    // 7. Retrieve all generated data from in-memory storage
    const stageData = await manager.get.stageData(0);
    const matches = stageData.match;
    const participants = stageData.participant;
    const groups = stageData.group;

    const groupsMap = new Map(groups.map(g => [g.id, g]));
    const participantsMap = new Map(participants.map(p => [p.id, p]));

    // 8. Connect to database client
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 9. Delete any existing matches for this tournament to ensure clean slate
      await bracketRepository.deleteMatchesByTournament(tourId, client);

      const dbMatches = [];
      const memoryToDbIdMap = new Map();

      // 10. Insert all matches to get database UUIDs
      for (const m of matches) {
        // Resolve competitor IDs (name in brackets-manager corresponds to seeding element)
        const comp1_id = m.opponent1 && m.opponent1.id !== null ? participantsMap.get(m.opponent1.id)?.name : null;
        const comp2_id = m.opponent2 && m.opponent2.id !== null ? participantsMap.get(m.opponent2.id)?.name : null;

        const roundNum = m.round_id + 1;
        const stageName = format;

        // Resolve Status and Winner for BYEs:
        let status = 'locked';
        let winning_competitor_id = null;

        const isBye = (m.opponent1 === null && m.opponent2 !== null) || (m.opponent1 !== null && m.opponent2 === null);
        if (isBye) {
          status = 'bye';
          winning_competitor_id = (m.opponent1 !== null) ? comp1_id : comp2_id;
        } else if (m.status === 1) {
          status = 'ready';
        } else if (m.status === 2) {
          status = 'running';
        } else if (m.status === 3) {
          status = 'completed';
        } else if (m.status === 4) {
          status = 'archived';
        }

        // Resolve Group Name:
        const group = groupsMap.get(m.group_id);
        let groupName = 'Bracket';
        if (format === 'round_robin') {
          const groupNumber = group ? group.number : 1;
          const letter = String.fromCharCode(64 + groupNumber);
          groupName = `Group ${letter}`;
        } else if (format === 'double_elimination') {
          const groupNumber = group ? group.number : 1;
          groupName = groupNumber === 1 ? 'Upper Bracket' : (groupNumber === 2 ? 'Lower Bracket' : 'Grand Final');
        } else if (format === 'single_elimination') {
          const groupNumber = group ? group.number : 1;
          groupName = groupNumber === 2 ? 'Consolation Final' : 'Bracket';
        }

        const dbMatchId = await bracketRepository.insertGeneratedMatch(tourId, {
          roundNum,
          stageName,
          comp1_id,
          comp2_id,
          winning_competitor_id,
          groupName,
          status
        }, client);

        memoryToDbIdMap.set(m.id, dbMatchId);
        dbMatches.push({ memoryMatch: m, dbMatchId, winning_competitor_id, resolvedStatus: status });
      }

      // 11. Update progression references (next_winner_match_id and next_loser_match_id)
      for (const item of dbMatches) {
        const { memoryMatch, dbMatchId, winning_competitor_id, resolvedStatus } = item;

        let nextWinnerMatchId = null;
        let nextLoserMatchId = null;

        if (format !== 'round_robin') {
          const nextMemoryMatches = await manager.find.nextMatches(memoryMatch.id);

          if (nextMemoryMatches.length > 0) {
            const { nextWinnerMatch, nextLoserMatch } = this._getWinnerAndLoserPaths(nextMemoryMatches, groupsMap);
            if (nextWinnerMatch) {
              nextWinnerMatchId = memoryToDbIdMap.get(nextWinnerMatch.id) || null;
            }
            if (nextLoserMatch) {
              nextLoserMatchId = memoryToDbIdMap.get(nextLoserMatch.id) || null;
            }
          }
        }

        await bracketRepository.updateProgressionReferences(dbMatchId, nextWinnerMatchId, nextLoserMatchId, client);

        // Propagate generated BYE winners immediately
        if (resolvedStatus === 'bye' && winning_competitor_id && nextWinnerMatchId) {
          await this._propagateGeneratedBye(client, winning_competitor_id, nextWinnerMatchId);
        }
      }

      await client.query('COMMIT');
      return { totalMatches: matches.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async _propagateGeneratedBye(client, winnerId, nextWinnerMatchId) {
    if (!nextWinnerMatchId || !winnerId) return;

    // Fetch next match
    const nextMatch = await bracketRepository.getMatchCompetitorsAndStatus(nextWinnerMatchId, client);
    if (!nextMatch) return;

    let updatedCompetitor1 = nextMatch.competitor1_id;
    let updatedCompetitor2 = nextMatch.competitor2_id;
    let nextStatus = nextMatch.status;

    if (!updatedCompetitor1) {
      updatedCompetitor1 = winnerId;
    } else if (!updatedCompetitor2 && updatedCompetitor1 !== winnerId) {
      updatedCompetitor2 = winnerId;
    }

    if (updatedCompetitor1 && updatedCompetitor2 && nextStatus === 'locked') {
      nextStatus = 'ready';
    }

    await bracketRepository.updateMatchCompetitorsAndStatus(
      nextWinnerMatchId,
      updatedCompetitor1,
      updatedCompetitor2,
      nextStatus,
      client
    );
  }

  _getWinnerAndLoserPaths(nextMatches, groupsMap) {
    let nextWinnerMatch = null;
    let nextLoserMatch = null;

    for (const nextMatch of nextMatches) {
      const group = groupsMap.get(nextMatch.group_id);
      if (!group) continue;

      if (group.number === 1 || group.number === 3) {
        nextWinnerMatch = nextMatch;
      } else if (group.number === 2) {
        nextLoserMatch = nextMatch;
      }
    }

    if (nextMatches.length === 1 && !nextWinnerMatch) {
      nextWinnerMatch = nextMatches[0];
    }

    return { nextWinnerMatch, nextLoserMatch };
  }

  async getBracket(tourId) {
    const matches = await bracketRepository.getMatchesByTournament(tourId);

    return matches.map(m => {
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
    });
  }

  async getBrackets(tourId) {
    const tournament = await bracketRepository.getTournamentFormat(tourId);
      if (!tournament) throw new AppError('Tournament not found.', 404);

  // Round scoring has its own standings view — route away from bracket logic
      if (tournament.tour_format === 'round_scoring') {
       return this.getRoundScoringStandings(tourId);
      }

    const matches = await this.getBracket(tourId);

    const grouped = {};
    for (const match of matches) {
      const stage = match.stage || 'bracket';
      if (!grouped[stage]) {
        grouped[stage] = [];
      }
      grouped[stage].push(match);
    }

    return Object.entries(grouped).map(([stage, stageMatches]) => ({
      stage,
      matches: stageMatches
    }));

    
  }

  // ── Round Scoring: Generate rounds ────────────────────────────────────────

async generateRoundScoringBracket(tourId, tournament) {
  const competitors = await bracketRepository.getCompetitorsForSeeding(tourId);
  if (competitors.length < 2) {
    throw new AppError('At least 2 competitors are required.', 400);
  }

  const advancePerRound = tournament.advance_per_group || 3;
  const totalRounds     = this._calcRoundScoringRounds(competitors.length, advancePerRound);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clean slate
    await bracketRepository.deleteMatchesByTournament(tourId, client);
    await bracketRepository.updateTournamentRoundCount(tourId, totalRounds, client);

    // Insert one match row per round
    // Round 1 is immediately 'ready', rest stay 'locked' until previous round completes
    for (let r = 1; r <= totalRounds; r++) {
      const matchId = await bracketRepository.insertRoundScoringMatch(tourId, r, client);

      if (r === 1) {
        await client.query(
          `UPDATE matches SET status = 'ready' WHERE match_id = $1`,
          [matchId]
        );
      }
    }

    await client.query('COMMIT');

    const rounds = await bracketRepository.getRoundScoringMatches(tourId);
    return {
      format:        'round_scoring',
      total_rounds:  totalRounds,
      advance_per_round: advancePerRound,
      total_competitors: competitors.length,
      rounds,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── Round Scoring: Submit scores for a round ──────────────────────────────

async submitRoundScores(tourId, matchId, scores, organizerId) {
  // scores = [{ comp_id, score }]

  const match = await bracketRepository.getRoundScoringMatch(matchId, tourId);
  if (!match) throw new AppError('Round match not found in this tournament.', 404);
  if (match.created_by !== organizerId) throw new AppError('Access denied.', 403);
  if (match.status === 'completed') throw new AppError('This round is already completed.', 400);
  if (match.status === 'locked') {
    throw new AppError('This round is not open yet. Complete the previous round first.', 400);
  }

  // Validate all submitted comp_ids belong to this tournament
  const { rows: validComps } = await pool.query(
    `SELECT comp_id FROM competitors WHERE tour_id = $1`,
    [tourId]
  );
  const validIdSet = new Set(validComps.map(c => c.comp_id));

  for (const s of scores) {
    if (!validIdSet.has(s.comp_id)) {
      throw new AppError(`Competitor ${s.comp_id} does not belong to this tournament.`, 400);
    }
    if (typeof s.score !== 'number' || s.score < 0) {
      throw new AppError(`Score for competitor ${s.comp_id} must be a non-negative number.`, 400);
    }
  }

  // Rank: highest score = rank 1
  const ranked = [...scores]
    .sort((a, b) => b.score - a.score)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  const advanceCount = match.advance_per_group || 3;
  const isLastRound  = match.round === match.tour_round;

  // On the final round everyone gets ranked, top 3 are podium
  // On earlier rounds, only top advanceCount survive
  const effectiveAdvance = isLastRound ? 3 : advanceCount;

  const roundScores = ranked.map(r => ({
    comp_id:    r.comp_id,
    score:      r.score,
    rank:       r.rank,
    advanced:   r.rank <= effectiveAdvance,
    eliminated: r.rank >  effectiveAdvance,
  }));

  const survivorIds = ranked
    .filter(r => r.rank <= effectiveAdvance)
    .map(r => r.comp_id);

  const eliminatedIds = ranked
    .filter(r => r.rank > effectiveAdvance)
    .map(r => r.comp_id);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Save scores to this round's match
    await bracketRepository.submitRoundScores(matchId, roundScores, survivorIds, client);

    // Unlock next round if not the final
    if (!isLastRound) {
      await bracketRepository.unlockNextRound(tourId, match.round + 1, client);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Enrich response with competitor names
  const allCompIds  = ranked.map(r => r.comp_id);
  const compDetails = await bracketRepository.getCompetitorsByIds(allCompIds);
  const compMap     = Object.fromEntries(compDetails.map(c => [c.comp_id, c]));

  const enrichedRanking = ranked.map(r => ({
    rank:       r.rank,
    comp_id:    r.comp_id,
    comp_name:  compMap[r.comp_id]?.comp_name  || 'Unknown',
    comp_logo:  compMap[r.comp_id]?.comp_logo  || null,
    score:      r.score,
    advanced:   r.rank <= effectiveAdvance,
    eliminated: r.rank >  effectiveAdvance,
  }));

  return {
    round:       match.round,
    is_final:    isLastRound,
    ranking:     enrichedRanking,
    survivors:   survivorIds,
    eliminated:  eliminatedIds,
    final_podium: isLastRound
      ? enrichedRanking.slice(0, 3).map((r, i) => ({
          position:  i + 1,
          comp_id:   r.comp_id,
          comp_name: r.comp_name,
          comp_logo: r.comp_logo,
          score:     r.score,
        }))
      : null,
  };
}

// ── Round Scoring: Get current standings ─────────────────────────────────

async getRoundScoringStandings(tourId) {
  const rounds = await bracketRepository.getRoundScoringMatches(tourId);
  if (!rounds.length) throw new AppError('No rounds found. Generate the bracket first.', 404);

  const competitors = await bracketRepository.getCompetitorsForSeeding(tourId);
  const compMap     = Object.fromEntries(competitors.map(c => [c.comp_id, c]));

  // Find the latest completed round for current rankings
  const completed = rounds.filter(r => r.status === 'completed');
  const latest    = completed[completed.length - 1];

  let currentStandings = [];
  if (latest?.round_scores) {
    currentStandings = latest.round_scores.map(r => ({
      rank:      r.rank,
      comp_id:   r.comp_id,
      comp_name: compMap[r.comp_id]?.comp_name || 'Unknown',
      comp_logo: compMap[r.comp_id]?.comp_logo || null,
      score:     r.score,
      status:    r.eliminated ? 'eliminated' : 'active',
    }));
  }

  // Current round = first non-completed round
  const currentRound = rounds.find(r => r.status !== 'completed') || null;

  return {
    current_round:    currentRound?.round || null,
    completed_rounds: completed.length,
    total_rounds:     rounds.length,
    standings:        currentStandings,
    rounds:           rounds.map(r => ({
      match_id: r.match_id,
      round:    r.round,
      status:   r.status,
    })),
  };
}

// ── Helper: calculate how many rounds needed ──────────────────────────────

_calcRoundScoringRounds(participantCount, advancePerRound) {
  if (participantCount <= 3) return 1;
  let rounds    = 1;
  let remaining = participantCount;
  while (remaining > 3) {
    remaining = Math.ceil(remaining / advancePerRound);
    rounds++;
  }
  return rounds;
}
}

module.exports = new BracketService();
