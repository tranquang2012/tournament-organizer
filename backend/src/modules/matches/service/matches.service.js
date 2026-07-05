const pool = require('../../../shared/database/pool');
const AppError = require('../../../shared/errors/AppError');

class MatchesService {
  async getMatch(matchId) {
    const { rows } = await pool.query(
      `SELECT 
        m.match_id, m.tour_id, m.round, m.stage, m.scheduled_start, m.scheduled_end,
        m.competitor1_id, m.competitor2_id, m.score1, m.score2,
        m.winning_competitor_id, m.is_draw, m.next_winner_match_id, m.next_loser_match_id,
        c1.comp_name as c1_name, c1.comp_logo as c1_logo, c1.comp_size as c1_size,
        c2.comp_name as c2_name, c2.comp_logo as c2_logo, c2.comp_size as c2_size
      FROM matches m
      LEFT JOIN competitors c1 ON m.competitor1_id = c1.comp_id
      LEFT JOIN competitors c2 ON m.competitor2_id = c2.comp_id
      WHERE m.match_id = $1`,
      [matchId]
    );

    const m = rows[0];
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
      const { rows: matchRows } = await client.query(
        `SELECT tour_id, competitor1_id, competitor2_id, winning_competitor_id 
         FROM matches WHERE match_id = $1`,
        [matchId]
      );
      const currentMatch = matchRows[0];
      if (!currentMatch) {
        throw new AppError('Match not found.', 404);
      }

      // 2. Parse payload (supporting both flat keys and nested results array)
      let score1 = body.score1 !== undefined ? body.score1 : null;
      let score2 = body.score2 !== undefined ? body.score2 : null;
      let winning_competitor_id = body.winning_competitor_id !== undefined ? body.winning_competitor_id : null;
      let is_draw = body.is_draw !== undefined ? body.is_draw : false;

      if (Array.isArray(body.results)) {
        for (const r of body.results) {
          if (r.competitorId === currentMatch.competitor1_id) {
            score1 = r.score;
          } else if (r.competitorId === currentMatch.competitor2_id) {
            score2 = r.score;
          }
        }
      }

      if (body.winnerId !== undefined) {
        winning_competitor_id = body.winnerId;
      }
      if (body.isDraw !== undefined) {
        is_draw = body.isDraw;
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
      let newWinnerId = winning_competitor_id;
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

      // 3. Update current match in DB
      await client.query(
        `UPDATE matches
         SET score1 = $1, score2 = $2, winning_competitor_id = $3,
             result1 = $4, result2 = $5, is_draw = $6, updated_at = NOW()
         WHERE match_id = $7`,
        [score1, score2, newWinnerId, result1, result2, is_draw, matchId]
      );

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
    const matchField = pathType === 'winner' ? 'next_winner_match_id' : 'next_loser_match_id';

    const { rows } = await client.query(
      `SELECT ${matchField} FROM matches WHERE match_id = $1`,
      [matchId]
    );

    if (!rows[0] || !rows[0][matchField]) return;

    const nextMatchId = rows[0][matchField];

    const { rows: nextMatchRows } = await client.query(
      `SELECT competitor1_id, competitor2_id FROM matches WHERE match_id = $1`,
      [nextMatchId]
    );

    const nextMatch = nextMatchRows[0];
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

    await client.query(
      `UPDATE matches
       SET competitor1_id = $1, competitor2_id = $2, updated_at = NOW()
       WHERE match_id = $3`,
      [updatedCompetitor1, updatedCompetitor2, nextMatchId]
    );
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
        competitorId: m.competitor1_id,
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
        competitorId: m.competitor2_id,
        score: m.score2 || 0
      });
    }

    return {
      matchId: String(m.match_id),
      stage: m.stage,
      round: m.round,
      competitors,
      scheduledStart: m.scheduled_start,
      scheduledEnd: m.scheduled_end,
      results,
      winningCompetitorId: m.winning_competitor_id,
      isDraw: m.is_draw,
      nextWinnerMatchId: m.next_winner_match_id ? String(m.next_winner_match_id) : null,
      nextLoserMatchId: m.next_loser_match_id ? String(m.next_loser_match_id) : null
    };
  }
}

module.exports = new MatchesService();
