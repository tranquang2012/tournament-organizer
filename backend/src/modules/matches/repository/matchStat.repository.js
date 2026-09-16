const pool = require('../../../shared/database/pool');

class MatchStatRepository {
  async getStats(matchId) {
    const res = await pool.query(
      `SELECT id, match_id, name, type, value, comp_id
       FROM match_stats 
       WHERE match_id = $1`,
      [matchId]
    );
    return res.rows;
  }

  async createStat(matchId, name, type, compId = null) {
    const res = await pool.query(
      `INSERT INTO match_stats (match_id, name, type, comp_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, match_id, name, type, value, comp_id`,
      [matchId, name, type, compId]
    );
    return res.rows[0];
  }

  async updateStatValue(statId, matchId, value) {
    const res = await pool.query(
      `UPDATE match_stats 
       SET value = $1
       WHERE id = $2 AND match_id = $3
       RETURNING id, match_id, name, type, value, comp_id`,
      [value, statId, matchId]
    );
    return res.rows[0];
  }

  async incrementStatValue(statId, matchId, by) {
    // Atomic increment using Postgres casting
    const res = await pool.query(
      `UPDATE match_stats
       SET value = (COALESCE(value::int, 0) + $1)::text
       WHERE id = $2 AND match_id = $3 AND type = 'INTEGER'
       RETURNING id, match_id, name, type, value, comp_id`,
      [by, statId, matchId]
    );
    return res.rows[0];
  }

  async deleteStat(statId, matchId) {
    const res = await pool.query(
      `DELETE FROM match_stats 
       WHERE id = $1 AND match_id = $2
       RETURNING id`,
      [statId, matchId]
    );
    return res.rows[0];
  }

  // To verify ownership
  async getTournamentIdByMatch(matchId) {
    const res = await pool.query(
      `SELECT tour_id FROM matches WHERE match_id = $1`,
      [matchId]
    );
    return res.rows[0]?.tour_id;
  }
}

module.exports = new MatchStatRepository();
