const pool = require('../../../shared/database/pool');
const AppError = require('../../../shared/errors/AppError');
const bracketRepository = require('../repository/bracket.repository');

const bracketStandardService = require('./bracketStandard.service');
const bracketRoundScoringService = require('./bracketRoundScoring.service');
const BracketHybridService = require('./bracketHybrid.service');

// Initialize the hybrid service with its dependencies
const bracketHybridService = new BracketHybridService(bracketStandardService, bracketRoundScoringService);

class BracketService {
  async generateBracket(tourId) {
    const tournament = await bracketRepository.getTournamentFormat(tourId);
    if (!tournament) {
      throw new AppError('Tournament not found.', 404);
    }

    const format = tournament.tour_format;
    if (format === 'hybrid') {
      return bracketHybridService.generateHybridBracket(tourId, tournament);
    }
    if (format === 'round_scoring') {
      return bracketRoundScoringService.generateRoundScoringBracket(tourId, tournament);
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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await bracketRepository.deleteMatchesByTournament(tourId, client);
      const result = await bracketStandardService.generateBracketStage(tourId, {
        format,
        seeding,
        groupCount: tournament.group_count || 1,
        stageName: format,
        client
      });
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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
        competitor1_id: m.competitor1_id,
        competitor2_id: m.competitor2_id,
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
      return bracketRoundScoringService.getRoundScoringStandings(tourId);
    }

    if (tournament.tour_format === 'hybrid') {
      await bracketHybridService.ensureHybridStageTwoGenerated(tourId);
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

  async submitRoundScores(tourId, matchId, scores, organizerId) {
    return bracketRoundScoringService.submitRoundScores(tourId, matchId, scores, organizerId, bracketHybridService);
  }

  async ensureHybridStageTwoGenerated(tourId) {
    return bracketHybridService.ensureHybridStageTwoGenerated(tourId);
  }

  async getRoundScoringStandings(tourId) {
    return bracketRoundScoringService.getRoundScoringStandings(tourId);
  }
}

module.exports = new BracketService();
