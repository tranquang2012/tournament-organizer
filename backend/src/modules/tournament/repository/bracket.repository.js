const pool = require('../../../shared/database/pool');

class BracketRepository {

  async getTournamentFormat(tourId, executor = pool) {
    const { rows } = await executor.query(
      `SELECT tour_id, tour_format FROM tournament WHERE tour_id = $1`,
      [tourId]
    );
    return rows[0];
  }

  async getCompetitorsForSeeding(tourId, executor = pool) {
    const { rows } = await executor.query(
      `SELECT comp_id, comp_name FROM competitors WHERE tour_id = $1 ORDER BY comp_name ASC`,
      [tourId]
    );
    return rows;
  }

  async insertGeneratedMatch(tourId, matchData, executor = pool) {
    const { roundNum, stageName, comp1_id, comp2_id, winning_competitor_id, groupName, status } = matchData;
    const { rows } = await executor.query(
      `INSERT INTO matches (
        tour_id, round, stage, competitor1_id, competitor2_id,
        score1, score2, result1, result2, winning_competitor_id, is_draw,
        group_name, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING match_id`,
      [
        tourId,
        roundNum,
        stageName,
        comp1_id,
        comp2_id,
        null, null, null, null, winning_competitor_id, false,
        groupName,
        status
      ]
    );
    return rows[0].match_id;
  }

  async updateProgressionReferences(matchId, nextWinnerMatchId, nextLoserMatchId, executor = pool) {
    await executor.query(
      `UPDATE matches
       SET next_winner_match_id = $1, next_loser_match_id = $2, updated_at = NOW()
       WHERE match_id = $3`,
      [nextWinnerMatchId, nextLoserMatchId, matchId]
    );
  }

  async getMatchesByTournament(tourId, executor = pool) {
    const { rows } = await executor.query(
      `SELECT 
        m.match_id, m.round, m.stage, m.group_name, m.status, m.scheduled_start, m.scheduled_end,
        m.competitor1_id, m.competitor2_id, m.score1, m.score2,
        m.winning_competitor_id, m.is_draw, m.next_winner_match_id, m.next_loser_match_id,
        c1.comp_name as c1_name, c1.comp_logo as c1_logo, c1.comp_size as c1_size,
        c2.comp_name as c2_name, c2.comp_logo as c2_logo, c2.comp_size as c2_size
      FROM matches m
      LEFT JOIN competitors c1 ON m.competitor1_id = c1.comp_id
      LEFT JOIN competitors c2 ON m.competitor2_id = c2.comp_id
      WHERE m.tour_id = $1
      ORDER BY m.stage, m.round, m.match_id`,
      [tourId]
    );
    return rows;
  }
}

module.exports = new BracketRepository();
