const { InMemoryDatabase } = require('brackets-memory-db');
const { BracketsManager } = require('brackets-manager');
const pool = require('../../../shared/database/pool');
const AppError = require('../../../shared/errors/AppError');

class BracketService {
  async generateBracket(tourId) {

    // 1. Get tournament details
    const { rows: tourRows } = await pool.query(
      `SELECT tour_id, tour_format FROM tournament WHERE tour_id = $1`,
      [tourId]
    );
    const tournament = tourRows[0];
    if (!tournament) {
      throw new AppError('Tournament not found.', 404);
    }

    const format = tournament.tour_format;
    if (!['single_elimination', 'double_elimination', 'round_robin'].includes(format)) {
      throw new AppError(`Format '${format}' does not support standard bracket generation.`, 400);
    }

    // 2. Get competitors
    const { rows: competitors } = await pool.query(
      `SELECT comp_id, comp_name FROM competitors WHERE tour_id = $1 ORDER BY comp_name ASC`,
      [tourId]
    );

    if (competitors.length < 2) {
      throw new AppError('At least 2 competitors are required to generate matches.', 400);
    }

    const seeding = competitors.map(c => c.comp_id);

    // 3. Initialize brackets-manager in memory
    const db = new InMemoryDatabase();
    const manager = new BracketsManager(db);

    // 4. Create stage in memory
    await manager.create.stage({
      tournamentId: 1, // Dummy ID in-memory
      name: 'Bracket Stage',
      type: format,
      seeding,
      settings: {
        size: seeding.length,
        grandFinal: 'double', // standard for double elimination
      }
    });

    // 5. Retrieve all generated data from in-memory storage
    const stageData = await manager.get.stageData(0);
    const matches = stageData.match;
    const participants = stageData.participant;
    const groups = stageData.group;

    const groupsMap = new Map(groups.map(g => [g.id, g]));
    const participantsMap = new Map(participants.map(p => [p.id, p]));

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 6. Delete any existing matches for this tournament to ensure clean slate
      await client.query(`DELETE FROM matches WHERE tour_id = $1`, [tourId]);

      const dbMatches = [];
      const memoryToDbIdMap = new Map();

      // 7. Insert all matches to get auto-increment IDs
      for (const m of matches) {
        // Resolve competitor IDs (name in brackets-manager corresponds to seeding element)
        const comp1_id = m.opponent1 && m.opponent1.id !== null ? participantsMap.get(m.opponent1.id)?.name : null;
        const comp2_id = m.opponent2 && m.opponent2.id !== null ? participantsMap.get(m.opponent2.id)?.name : null;

        const roundNum = m.round_id + 1;
        const stageName = format;

        const { rows: inserted } = await client.query(
          `INSERT INTO matches (
            tour_id, round, stage, competitor1_id, competitor2_id,
            score1, score2, result1, result2, winning_competitor_id, is_draw
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING match_id`,
          [
            tourId,
            roundNum,
            stageName,
            comp1_id,
            comp2_id,
            null, null, null, null, null, false
          ]
        );

        const dbMatchId = inserted[0].match_id;
        memoryToDbIdMap.set(m.id, dbMatchId);
        dbMatches.push({ memoryMatch: m, dbMatchId });
      }

      // 8. Update progression references (next_winner_match_id and next_loser_match_id)
      for (const item of dbMatches) {
        const { memoryMatch, dbMatchId } = item;

        const nextMemoryMatches = await manager.find.nextMatches(memoryMatch.id);

        let nextWinnerMatchId = null;
        let nextLoserMatchId = null;

        if (nextMemoryMatches.length > 0) {
          const { nextWinnerMatch, nextLoserMatch } = this._getWinnerAndLoserPaths(nextMemoryMatches, groupsMap);
          if (nextWinnerMatch) {
            nextWinnerMatchId = memoryToDbIdMap.get(nextWinnerMatch.id) || null;
          }
          if (nextLoserMatch) {
            nextLoserMatchId = memoryToDbIdMap.get(nextLoserMatch.id) || null;
          }
        }

        await client.query(
          `UPDATE matches
           SET next_winner_match_id = $1, next_loser_match_id = $2
           WHERE match_id = $3`,
          [nextWinnerMatchId, nextLoserMatchId, dbMatchId]
        );
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

  _getWinnerAndLoserPaths(nextMatches, groupsMap) {
    let nextWinnerMatch = null;
    let nextLoserMatch = null;

    for (const nextMatch of nextMatches) {
      const group = groupsMap.get(nextMatch.group_id);
      if (!group) continue;

      // group.number === 1 is winner bracket. group.number === 3 is final group (Grand Final)
      if (group.number === 1 || group.number === 3) {
        nextWinnerMatch = nextMatch;
      }
      // group.number === 2 is loser bracket
      else if (group.number === 2) {
        nextLoserMatch = nextMatch;
      }
    }

    //  If there is only 1 next match and we havent identified it as winner, it is winner path
    if (nextMatches.length === 1 && !nextWinnerMatch) {
      nextWinnerMatch = nextMatches[0];
    }

    return { nextWinnerMatch, nextLoserMatch };
  }

  async getBracket(tourId) {
    const { rows: matches } = await pool.query(
      `SELECT 
        m.match_id, m.round, m.stage, m.scheduled_start, m.scheduled_end,
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
    });
  }

  async getBrackets(tourId) {
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
}

module.exports = new BracketService();
