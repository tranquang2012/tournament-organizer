const pool = require('../../../shared/database/pool');

class MatchesRepository {

  async getMatch(matchId, executor = pool) {
    const { rows } = await executor.query(
      `SELECT 
        m.match_id, m.tour_id, m.round, m.stage, m.group_name, m.status, m.scheduled_start, m.scheduled_end,
        m.competitor1_id, m.competitor2_id, m.score1, m.score2,
        m.winning_competitor_id, m.is_draw, m.next_winner_match_id, m.next_loser_match_id,
        m.round_scores,
        c1.comp_name as c1_name, c1.comp_logo as c1_logo, c1.comp_size as c1_size,
        c2.comp_name as c2_name, c2.comp_logo as c2_logo, c2.comp_size as c2_size,
        t.tour_format, t.participant_type, t.tour_name, t.tour_banner
      FROM matches m
      LEFT JOIN competitors c1 ON m.competitor1_id = c1.comp_id
      LEFT JOIN competitors c2 ON m.competitor2_id = c2.comp_id
      LEFT JOIN tournament t ON m.tour_id = t.tour_id
      WHERE m.match_id = $1`,
      [matchId]
    );
    return rows[0];
  }

  async getMatchBase(matchId, executor = pool) {
    const { rows } = await executor.query(
      `SELECT tour_id, competitor1_id, competitor2_id, winning_competitor_id, status, group_name, next_winner_match_id, next_loser_match_id 
       FROM matches WHERE match_id = $1`,
      [matchId]
    );
    return rows[0];
  }

  async updateMatch(matchId, data, executor = pool) {
    const { score1, score2, winning_competitor_id, result1, result2, is_draw, status } = data;
    await executor.query(
      `UPDATE matches
       SET score1 = $1, score2 = $2, winning_competitor_id = $3,
           result1 = $4, result2 = $5, is_draw = $6, status = $7, updated_at = NOW()
       WHERE match_id = $8`,
      [score1, score2, winning_competitor_id, result1, result2, is_draw, status, matchId]
    );
  }

  async getNextMatchRef(matchId, executor = pool) {
    const { rows } = await executor.query(
      `SELECT next_winner_match_id, next_loser_match_id FROM matches WHERE match_id = $1`,
      [matchId]
    );
    return rows[0];
  }

  async getNextMatchBase(nextMatchId, executor = pool) {
    const { rows } = await executor.query(
      `SELECT competitor1_id, competitor2_id, status, winning_competitor_id FROM matches WHERE match_id = $1`,
      [nextMatchId]
    );
    return rows[0];
  }

  async updateNextMatchSlots(nextMatchId, competitor1_id, competitor2_id, status, winning_competitor_id = null, executor = pool) {
    await executor.query(
      `UPDATE matches
       SET competitor1_id = $1, competitor2_id = $2, status = $3, winning_competitor_id = $4, updated_at = NOW()
       WHERE match_id = $5`,
      [competitor1_id, competitor2_id, status, winning_competitor_id, nextMatchId]
    );
  }

  async updateSchedule(matchId, scheduled_start, scheduled_end, executor = pool) {
  const { rows } = await executor.query(
    `UPDATE matches
     SET scheduled_start = $1,
         scheduled_end   = $2,
         updated_at      = NOW()
     WHERE match_id = $3
     RETURNING match_id, scheduled_start, scheduled_end, status, tour_id`,
    [scheduled_start, scheduled_end, matchId]
  );
  return rows[0] || null;
}

async getScheduleConflicts(tourId, scheduled_start, scheduled_end, excludeMatchId = null, executor = pool) {
//return warning if overlap
  const { rows } = await executor.query(
    `SELECT match_id, round, stage, group_name, scheduled_start, scheduled_end,
            competitor1_id, competitor2_id
     FROM matches
     WHERE tour_id = $1
       AND match_id != $2
       AND scheduled_start IS NOT NULL
       AND scheduled_end   IS NOT NULL
       AND tstzrange(scheduled_start, scheduled_end) && tstzrange($3::timestamptz, $4::timestamptz)`,
    [tourId, excludeMatchId ?? '00000000-0000-0000-0000-000000000000', scheduled_start, scheduled_end]
  );
  return rows;
}

  async getScheduledMatches(executor = pool) {
    const { rows } = await executor.query(
      `SELECT 
        m.match_id,
        m.tour_id,
        m.round,
        m.stage,
        m.group_name,
        m.status,
        m.scheduled_start,
        m.scheduled_end,
        m.score1,
        m.score2,
        m.winning_competitor_id,
        m.is_draw,
        t.tour_name,
        c1.comp_name as c1_name,
        c2.comp_name as c2_name
      FROM matches m
      JOIN tournament t ON m.tour_id = t.tour_id
      LEFT JOIN competitors c1 ON m.competitor1_id = c1.comp_id
      LEFT JOIN competitors c2 ON m.competitor2_id = c2.comp_id
      WHERE m.scheduled_start IS NOT NULL
        AND m.scheduled_end IS NOT NULL
        AND t.tour_status <> 'draft'
      ORDER BY m.scheduled_start ASC`
    );
    return rows;
  }
}

module.exports = new MatchesRepository();
