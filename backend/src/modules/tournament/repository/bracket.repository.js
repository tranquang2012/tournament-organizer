const pool = require('../../../shared/database/pool');

class BracketRepository {

  async getTournamentFormat(tourId, executor = pool) {
    const { rows } = await executor.query(
      `SELECT tour_id, tour_format, group_count, advance_per_group FROM tournament WHERE tour_id = $1`,
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

  async deleteMatchesByTournament(tourId, executor = pool) {
    await executor.query(`DELETE FROM matches WHERE tour_id = $1`, [tourId]);
  }

  async getMatchCompetitorsAndStatus(matchId, executor = pool) {
    const { rows } = await executor.query(
      `SELECT competitor1_id, competitor2_id, status FROM matches WHERE match_id = $1`,
      [matchId]
    );
    return rows[0] || null;
  }

  async updateMatchCompetitorsAndStatus(matchId, competitor1_id, competitor2_id, status, executor = pool) {
    await executor.query(
      `UPDATE matches 
       SET competitor1_id = $1, competitor2_id = $2, status = $3 
       WHERE match_id = $4`,
      [competitor1_id, competitor2_id, status, matchId]
    );
  }

  async insertRoundScoringMatch(tourId, roundNum, executor = pool) {
  const { rows } = await executor.query(
    `INSERT INTO matches (
      tour_id, round, stage, status, is_draw, created_at, updated_at
    ) VALUES ($1, $2, 'round_scoring', 'locked', false, NOW(), NOW())
    RETURNING match_id`,
    [tourId, roundNum]
  );
  return rows[0].match_id;
}

async getRoundScoringMatches(tourId, executor = pool) {
  const { rows } = await executor.query(
    `SELECT match_id, round, status, round_scores
     FROM matches
     WHERE tour_id = $1 AND stage = 'round_scoring'
     ORDER BY round ASC`,
    [tourId]
  );
  return rows;
}

async getRoundScoringMatch(matchId, tourId, executor = pool) {
  const { rows } = await executor.query(
    `SELECT m.match_id, m.round, m.status, m.round_scores,
            t.created_by, t.advance_per_group, t.tour_round
     FROM matches m
     JOIN tournament t ON t.tour_id = m.tour_id
     WHERE m.match_id = $1 AND m.tour_id = $2 AND m.stage = 'round_scoring'`,
    [matchId, tourId]
  );
  return rows[0] || null;
}

async submitRoundScores(matchId, roundScores, survivorIds, executor = pool) {
  await executor.query(
    `UPDATE matches
     SET round_scores  = $1,
         status        = 'completed',
         result1       = $2,
         updated_at    = NOW()
     WHERE match_id = $3`,
    [
      JSON.stringify(roundScores),
      JSON.stringify(survivorIds),  // reuse result1 to store survivor list
      matchId,
    ]
  );
}

async unlockNextRound(tourId, nextRoundNum, executor = pool) {
  await executor.query(
    `UPDATE matches
     SET status = 'ready', updated_at = NOW()
     WHERE tour_id = $1 AND stage = 'round_scoring' AND round = $2`,
    [tourId, nextRoundNum]
  );
}

async getCompetitorsByIds(compIds, executor = pool) {
  const { rows } = await executor.query(
    `SELECT comp_id, comp_name, comp_logo
     FROM competitors
     WHERE comp_id = ANY($1::uuid[])`,
    [compIds]
  );
  return rows;
}

async updateTournamentRoundCount(tourId, totalRounds, executor = pool) {
  await executor.query(
    `UPDATE tournament SET tour_round = $1 WHERE tour_id = $2`,
    [totalRounds, tourId]
  );
}
}

module.exports = new BracketRepository();
