const pool = require('../../../shared/database/pool');

class RankingRepository {
  async getTournamentRankingData(tourId, executor = pool) {
    const { rows: tournamentRows } = await executor.query(
      `SELECT tour_id, tour_format, tour_status, group_count, advance_per_group,
              participant_type, first_stage_format, second_stage_format, sets_per_match
       FROM tournament
       WHERE tour_id = $1`,
      [tourId]
    );

    const tournament = tournamentRows[0] || null;
    if (!tournament) return null;

    const [{ rows: competitors }, { rows: matches }] = await Promise.all([
      executor.query(
        `SELECT comp_id, comp_name, comp_logo, comp_size
         FROM competitors
         WHERE tour_id = $1
         ORDER BY comp_name ASC NULLS LAST, comp_id ASC`,
        [tourId]
      ),
      executor.query(
        `SELECT match_id, stage, round, group_name, status,
                competitor1_id, competitor2_id, score1, score2,
                result1, result2, winning_competitor_id, is_draw,
                next_winner_match_id, next_loser_match_id, round_scores
         FROM matches
         WHERE tour_id = $1
         ORDER BY stage ASC, group_name ASC NULLS LAST, round ASC, match_id ASC`,
        [tourId]
      ),
    ]);

    return { tournament, competitors, matches };
  }
}

module.exports = new RankingRepository();
