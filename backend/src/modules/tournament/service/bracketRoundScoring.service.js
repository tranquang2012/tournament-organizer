const pool = require('../../../shared/database/pool');
const AppError = require('../../../shared/errors/AppError');
const bracketRepository = require('../repository/bracket.repository');

class BracketRoundScoringService {
  async generateRoundScoringBracket(tourId, tournament) {
    const competitors = await bracketRepository.getCompetitorsForSeeding(tourId);
    if (competitors.length < 2) {
      throw new AppError('At least 2 competitors are required.', 400);
    }

    const advancePerRound = tournament.advance_per_group || 3;
    const totalRounds = 1;

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
        format: 'round_scoring',
        total_rounds: totalRounds,
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

  async submitRoundScores(tourId, matchId, scores, organizerId, bracketHybridService) {
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

    // Hybrid structure is handled by hybrid service, so we will need to optionally call it
    let hybridStructure = null;
    let isHybridFirstStage = false;
    if (match.tour_format === 'hybrid' && bracketHybridService) {
       hybridStructure = bracketHybridService.getHybridStructure(match);
       const hybridFirstStage = hybridStructure?.stages?.[0];
       isHybridFirstStage = hybridFirstStage?.format === 'round_scoring' && match.stage === bracketHybridService.getStageKey(hybridFirstStage);
    }
    
    const advanceCount = isHybridFirstStage && hybridStructure?.stages?.[0]
      ? (hybridStructure.stages[0].advance_per_group || 3)
      : (match.advance_per_group || 3);
      
    const isLastRound = match.tour_format === 'hybrid' ? false : match.round === match.tour_round;

    // On the final round everyone gets ranked, top 3 are podium
    // On earlier rounds, only top advanceCount survive
    const effectiveAdvance = isLastRound ? 3 : advanceCount;

    const roundScores = ranked.map(r => ({
      comp_id: r.comp_id,
      score: r.score,
      rank: r.rank,
      advanced: r.rank <= effectiveAdvance,
      eliminated: r.rank > effectiveAdvance,
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

    if (match.tour_format === 'hybrid' && bracketHybridService) {
      await bracketHybridService.ensureHybridStageTwoGenerated(tourId);
    }

    // Enrich response with competitor names
    const allCompIds = ranked.map(r => r.comp_id);
    const compDetails = await bracketRepository.getCompetitorsByIds(allCompIds);
    const compMap = Object.fromEntries(compDetails.map(c => [c.comp_id, c]));

    const enrichedRanking = ranked.map(r => ({
      rank: r.rank,
      comp_id: r.comp_id,
      comp_name: compMap[r.comp_id]?.comp_name || 'Unknown',
      comp_logo: compMap[r.comp_id]?.comp_logo || null,
      score: r.score,
      advanced: r.rank <= effectiveAdvance,
      eliminated: r.rank > effectiveAdvance,
    }));

    return {
      round: match.round,
      is_final: isLastRound,
      ranking: enrichedRanking,
      survivors: survivorIds,
      eliminated: eliminatedIds,
      final_podium: isLastRound
        ? enrichedRanking.slice(0, 3).map((r, i) => ({
            position: i + 1,
            comp_id: r.comp_id,
            comp_name: r.comp_name,
            comp_logo: r.comp_logo,
            score: r.score,
          }))
        : null,
    };
  }

  _parseRoundScores(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    }
    return [];
  }

  async getRoundScoringStandings(tourId) {
    const rounds = await bracketRepository.getRoundScoringMatches(tourId);
    if (!rounds.length) throw new AppError('No rounds found. Generate the bracket first.', 404);

    const competitors = await bracketRepository.getCompetitorsForSeeding(tourId);
    const tournament = await bracketRepository.getTournamentFormat(tourId);
    const compMap = Object.fromEntries(competitors.map(c => [c.comp_id, c]));

    const mappedRounds = rounds.map(r => ({
      match_id: r.match_id,
      round: r.round,
      status: r.status,
      round_scores: this._parseRoundScores(r.round_scores).map(score => ({
        ...score,
        comp_name: compMap[score.comp_id]?.comp_name || 'Unknown',
        comp_logo: compMap[score.comp_id]?.comp_logo || null,
      })),
    }));

    // Find the latest completed round for current rankings
    const completed = mappedRounds.filter(r => r.status === 'completed');
    const latest = completed[completed.length - 1];

    let currentStandings = [];
    if (latest?.round_scores?.length) {
      currentStandings = latest.round_scores.map(r => ({
        rank: r.rank,
        comp_id: r.comp_id,
        comp_name: r.comp_name,
        comp_logo: r.comp_logo,
        score: r.score,
        status: r.eliminated ? 'eliminated' : 'active',
      }));
    }

    // Current round = first non-completed round
    const currentRound = mappedRounds.find(r => r.status !== 'completed') || null;

    return {
      current_round: currentRound?.round || null,
      completed_rounds: completed.length,
      total_rounds: mappedRounds.length,
      advance_per_round: tournament?.advance_per_group || 3,
      standings: currentStandings,
      rounds: mappedRounds,
    };
  }

  calcRoundScoringRounds(participantCount, advancePerRound) {
    if (participantCount <= 3) return 1;
    let rounds = 1;
    let remaining = participantCount;
    while (remaining > 3) {
      remaining = Math.ceil(remaining / advancePerRound);
      rounds++;
    }
    return rounds;
  }
}

module.exports = new BracketRoundScoringService();
