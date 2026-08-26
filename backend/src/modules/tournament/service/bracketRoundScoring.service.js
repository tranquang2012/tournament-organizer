const pool = require('../../../shared/database/pool');
const AppError = require('../../../shared/errors/AppError');
const bracketRepository = require('../repository/bracket.repository');
const { getSportRules } = require('../config/sportRules.config');

class BracketRoundScoringService {
  _buildRosterEntries(competitorIds, setsPerMatch = 1) {
    const expected = Math.max(1, Number(setsPerMatch) || 1);
    return competitorIds.map((comp_id) => ({
      comp_id,
      sets: Array.from({ length: expected }, () => null),
      score: null,
    }));
  }

  _groupLabel(index) {
    const letter = String.fromCharCode(65 + index);
    return `Group ${letter}`;
  }

  _aggregateScore(filledSets, scoreMode = 'points') {
    if (!filledSets.length) return null;
    if (scoreMode === 'time') return Math.min(...filledSets);
    return filledSets.reduce((sum, value) => sum + value, 0);
  }

  _normalizeScoreEntries(scores, setsPerMatch, { draft = false, scoreMode = 'points' } = {}) {
    const expected = Math.max(1, Number(setsPerMatch) || 1);

    return scores.map((entry) => {
      if (!entry?.comp_id) {
        throw new AppError('Each score entry must include comp_id.', 400);
      }

      const parseSetValue = (value, index) => {
        if (value === null || value === undefined || value === '') {
          if (draft) return null;
          throw new AppError(
            expected > 1
              ? `Game ${index + 1} score for competitor ${entry.comp_id} must be a non-negative number.`
              : `Score for competitor ${entry.comp_id} must be a non-negative number.`,
            400
          );
        }

        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric < 0) {
          throw new AppError(
            expected > 1
              ? `Game ${index + 1} score for competitor ${entry.comp_id} must be a non-negative number.`
              : `Score for competitor ${entry.comp_id} must be a non-negative number.`,
            400
          );
        }
        return numeric;
      };

      if (Array.isArray(entry.sets)) {
        if (!draft && entry.sets.length !== expected) {
          throw new AppError(`Each competitor must have ${expected} game score(s).`, 400);
        }
        if (entry.sets.length > expected) {
          throw new AppError(`Each competitor can have at most ${expected} game score(s).`, 400);
        }

        const sets = Array.from({ length: expected }, (_, index) => parseSetValue(entry.sets[index], index));
        const filled = sets.filter((value) => value != null);

        return {
          comp_id: entry.comp_id,
          sets,
          score: this._aggregateScore(filled, scoreMode),
        };
      }

      if (draft && (entry.score === null || entry.score === undefined || entry.score === '')) {
        if (expected !== 1) {
          throw new AppError(`Each competitor must include ${expected} game scores in sets.`, 400);
        }
        return { comp_id: entry.comp_id, sets: [null], score: null };
      }

      const numericScore = parseSetValue(entry.score, 0);
      if (expected !== 1) {
        throw new AppError(`Each competitor must include ${expected} game scores in sets.`, 400);
      }

      return {
        comp_id: entry.comp_id,
        sets: [numericScore],
        score: numericScore,
      };
    });
  }

  async generateRoundScoringBracket(tourId, tournament) {
    const competitors = await bracketRepository.getCompetitorsForSeeding(tourId);
    if (competitors.length < 2) {
      throw new AppError('At least 2 competitors are required.', 400);
    }

    const sportRules = getSportRules(tournament.sp_id);
    if (sportRules?.lobby_size) {
      const allowed = [8, 16, 32, 64];
      if (!allowed.includes(competitors.length)) {
        throw new AppError(
          `${sportRules.sport_name} requires 8, 16, 32, or 64 players. This tournament has ${competitors.length}.`,
          400
        );
      }
      if (competitors.length !== sportRules.lobby_size) {
        throw new AppError(
          `${sportRules.sport_name} with ${competitors.length} players must use hybrid format.`,
          400
        );
      }
    }

    const advancePerRound = tournament.advance_per_group || 3;
    const totalRounds = 1;
    const setsPerMatch = tournament.sets_per_match || 1;
    const roster = this._buildRosterEntries(
      competitors.map((c) => c.comp_id),
      setsPerMatch
    );

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clean slate
      await bracketRepository.deleteMatchesByTournament(tourId, client);
      await bracketRepository.updateTournamentRoundCount(tourId, totalRounds, client);

      const matchId = await bracketRepository.insertRoundScoringMatch(tourId, 1, client, 'round_scoring', {
        groupName: sportRules?.lobby_size ? 'Lobby' : null,
        roundScores: sportRules?.lobby_size ? roster : null,
      });

      await client.query(
        `UPDATE matches SET status = 'ready' WHERE match_id = $1`,
        [matchId]
      );

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

  async submitRoundScores(tourId, matchId, scores, organizerId, bracketHybridService, { finalize = true } = {}) {
    const match = await bracketRepository.getRoundScoringMatch(matchId, tourId);
    if (!match) throw new AppError('Round match not found in this tournament.', 404);
    if (match.created_by !== organizerId) throw new AppError('Access denied.', 403);
    if (match.status === 'completed') throw new AppError('This round is already completed.', 400);
    if (match.status === 'locked') {
      throw new AppError('This round is not open yet. Complete the previous round first.', 400);
    }

    const { rows: validComps } = await pool.query(
      `SELECT comp_id FROM competitors WHERE tour_id = $1`,
      [tourId]
    );
    const validIdSet = new Set(validComps.map(c => String(c.comp_id)));
    const existingRoster = this._parseRoundScores(match.round_scores)
      .filter((entry) => entry?.comp_id)
      .map((entry) => String(entry.comp_id));
    const rosterIdSet = existingRoster.length ? new Set(existingRoster) : null;

    const sportRules = getSportRules(match.sp_id);
    const scoreMode = sportRules?.score_mode || 'points';

    const normalizedScores = this._normalizeScoreEntries(
      scores,
      match.sets_per_match || 1,
      { draft: !finalize, scoreMode }
    );

    for (const s of normalizedScores) {
      if (!validIdSet.has(String(s.comp_id))) {
        throw new AppError(`Competitor ${s.comp_id} does not belong to this tournament.`, 400);
      }
      if (rosterIdSet && !rosterIdSet.has(String(s.comp_id))) {
        throw new AppError(`Competitor ${s.comp_id} is not assigned to this lobby.`, 400);
      }
    }

    if (finalize && rosterIdSet && normalizedScores.length !== rosterIdSet.size) {
      throw new AppError(`Each lobby requires scores for all ${rosterIdSet.size} assigned players.`, 400);
    }

    if (!finalize) {
      const hasAnyScore = normalizedScores.some((entry) => (
        Array.isArray(entry.sets) && entry.sets.some((value) => value != null)
      ));
      if (!hasAnyScore) {
        throw new AppError('Enter at least one game score before saving.', 400);
      }

      const draftScores = normalizedScores.map((entry) => ({
        comp_id: entry.comp_id,
        sets: entry.sets,
        score: entry.score,
      }));

      await bracketRepository.saveRoundScoresDraft(matchId, draftScores);

      return {
        round: match.round,
        saved: true,
        finalized: false,
        scores: draftScores,
      };
    }

    // Rank by sport mode: lowest time or highest score
    const ranked = [...normalizedScores]
      .sort((a, b) => (scoreMode === 'time' ? a.score - b.score : b.score - a.score))
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
      
    const isHybridStageTwo = match.tour_format === 'hybrid'
      && match.stage === 'stage_2'
      && match.second_stage_format === 'round_scoring';
    const isLastRound = isHybridStageTwo
      || (match.tour_format !== 'hybrid' && match.round === match.tour_round);

    // On the final round everyone gets ranked, top 3 are podium
    // On earlier rounds, only top advanceCount survive
    const effectiveAdvance = isLastRound ? 3 : advanceCount;

    const roundScores = ranked.map(r => ({
      comp_id: r.comp_id,
      sets: r.sets,
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
      sets: r.sets,
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

  async getRoundScoringStandings(tourId, stageName = null) {
    const rounds = stageName
      ? await bracketRepository.getRoundScoringMatchesByStage(tourId, stageName)
      : await bracketRepository.getRoundScoringMatches(tourId);
    if (!rounds.length) throw new AppError('No rounds found. Generate the bracket first.', 404);

    const competitors = await bracketRepository.getCompetitorsForSeeding(tourId);
    const tournament = await bracketRepository.getTournamentFormat(tourId);
    const compMap = Object.fromEntries(competitors.map(c => [c.comp_id, c]));

    const mappedRounds = rounds.map(r => ({
      match_id: r.match_id,
      round: r.round,
      group_name: r.group_name || null,
      status: r.status,
      scheduled_start: r.scheduled_start || null,
      scheduled_end: r.scheduled_end || null,
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
        sets: Array.isArray(r.sets) ? r.sets : null,
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
      sets_per_match: tournament?.sets_per_match || 1,
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
