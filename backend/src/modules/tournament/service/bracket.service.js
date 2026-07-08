const { InMemoryDatabase } = require('brackets-memory-db');
const { BracketsManager } = require('brackets-manager');
const pool = require('../../../shared/database/pool');
const AppError = require('../../../shared/errors/AppError');
const bracketRepository = require('../repository/bracket.repository');

class BracketService {
  async generateBracket(tourId) {
    // 1. Get tournament details
    const tournament = await bracketRepository.getTournamentFormat(tourId);
    if (!tournament) {
      throw new AppError('Tournament not found.', 404);
    }

    const format = tournament.tour_format;
    if (!['single_elimination', 'double_elimination', 'round_robin'].includes(format)) {
      throw new AppError(`Format '${format}' does not support standard bracket generation.`, 400);
    }

    // 2. Get competitors
    const competitors = await bracketRepository.getCompetitorsForSeeding(tourId);
    if (competitors.length < 2) {
      throw new AppError('At least 2 competitors are required to generate matches.', 400);
    }

    const seeding = competitors.map(c => c.comp_id);

    // 3. Initialize brackets-manager in memory
    const db = new InMemoryDatabase();
    const manager = new BracketsManager(db);

    // 4. Determine stage size (elimination formats require a power of two)
    let stageSize = seeding.length;
    if (format === 'single_elimination' || format === 'double_elimination') {
      stageSize = Math.pow(2, Math.ceil(Math.log2(seeding.length)));
      if (stageSize < 2) stageSize = 2;
    }

    // 5. Build settings
    const settings = {
      size: stageSize,
    };

    if (format === 'double_elimination') {
      settings.grandFinal = 'single';
    } else if (format === 'single_elimination') {
      settings.consolationFinal = true;
    } else if (format === 'round_robin') {
      settings.groupCount = tournament.group_count || 1;
    }

    // 6. Create stage in memory
    await manager.create.stage({
      tournamentId: 1, // Dummy ID in-memory
      name: 'Bracket Stage',
      type: format,
      seeding,
      settings
    });

    // 7. Retrieve all generated data from in-memory storage
    const stageData = await manager.get.stageData(0);
    const matches = stageData.match;
    const participants = stageData.participant;
    const groups = stageData.group;

    const groupsMap = new Map(groups.map(g => [g.id, g]));
    const participantsMap = new Map(participants.map(p => [p.id, p]));

    // 8. Connect to database client
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 9. Delete any existing matches for this tournament to ensure clean slate
      await bracketRepository.deleteMatchesByTournament(tourId, client);

      const dbMatches = [];
      const memoryToDbIdMap = new Map();

      // 10. Insert all matches to get database UUIDs
      for (const m of matches) {
        // Resolve competitor IDs (name in brackets-manager corresponds to seeding element)
        const comp1_id = m.opponent1 && m.opponent1.id !== null ? participantsMap.get(m.opponent1.id)?.name : null;
        const comp2_id = m.opponent2 && m.opponent2.id !== null ? participantsMap.get(m.opponent2.id)?.name : null;

        const roundNum = m.round_id + 1;
        const stageName = format;

        // Resolve Status and Winner for BYEs:
        let status = 'locked';
        let winning_competitor_id = null;

        const isBye = (m.opponent1 === null && m.opponent2 !== null) || (m.opponent1 !== null && m.opponent2 === null);
        if (isBye) {
          status = 'bye';
          winning_competitor_id = (m.opponent1 !== null) ? comp1_id : comp2_id;
        } else if (m.status === 1) {
          status = 'ready';
        } else if (m.status === 2) {
          status = 'running';
        } else if (m.status === 3) {
          status = 'completed';
        } else if (m.status === 4) {
          status = 'archived';
        }

        // Resolve Group Name:
        const group = groupsMap.get(m.group_id);
        let groupName = 'Bracket';
        if (format === 'round_robin') {
          const groupNumber = group ? group.number : 1;
          const letter = String.fromCharCode(64 + groupNumber);
          groupName = `Group ${letter}`;
        } else if (format === 'double_elimination') {
          const groupNumber = group ? group.number : 1;
          groupName = groupNumber === 1 ? 'Upper Bracket' : (groupNumber === 2 ? 'Lower Bracket' : 'Grand Final');
        } else if (format === 'single_elimination') {
          const groupNumber = group ? group.number : 1;
          groupName = groupNumber === 2 ? 'Consolation Final' : 'Bracket';
        }

        const dbMatchId = await bracketRepository.insertGeneratedMatch(tourId, {
          roundNum,
          stageName,
          comp1_id,
          comp2_id,
          winning_competitor_id,
          groupName,
          status
        }, client);

        memoryToDbIdMap.set(m.id, dbMatchId);
        dbMatches.push({ memoryMatch: m, dbMatchId, winning_competitor_id, resolvedStatus: status });
      }

      // 11. Update progression references (next_winner_match_id and next_loser_match_id)
      for (const item of dbMatches) {
        const { memoryMatch, dbMatchId, winning_competitor_id, resolvedStatus } = item;

        let nextWinnerMatchId = null;
        let nextLoserMatchId = null;

        if (format !== 'round_robin') {
          const nextMemoryMatches = await manager.find.nextMatches(memoryMatch.id);

          if (nextMemoryMatches.length > 0) {
            const { nextWinnerMatch, nextLoserMatch } = this._getWinnerAndLoserPaths(nextMemoryMatches, groupsMap);
            if (nextWinnerMatch) {
              nextWinnerMatchId = memoryToDbIdMap.get(nextWinnerMatch.id) || null;
            }
            if (nextLoserMatch) {
              nextLoserMatchId = memoryToDbIdMap.get(nextLoserMatch.id) || null;
            }
          }
        }

        await bracketRepository.updateProgressionReferences(dbMatchId, nextWinnerMatchId, nextLoserMatchId, client);

        // Propagate generated BYE winners immediately
        if (resolvedStatus === 'bye' && winning_competitor_id && nextWinnerMatchId) {
          await this._propagateGeneratedBye(client, winning_competitor_id, nextWinnerMatchId);
        }
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

  async _propagateGeneratedBye(client, winnerId, nextWinnerMatchId) {
    if (!nextWinnerMatchId || !winnerId) return;

    // Fetch next match
    const nextMatch = await bracketRepository.getMatchCompetitorsAndStatus(nextWinnerMatchId, client);
    if (!nextMatch) return;

    let updatedCompetitor1 = nextMatch.competitor1_id;
    let updatedCompetitor2 = nextMatch.competitor2_id;
    let nextStatus = nextMatch.status;

    if (!updatedCompetitor1) {
      updatedCompetitor1 = winnerId;
    } else if (!updatedCompetitor2 && updatedCompetitor1 !== winnerId) {
      updatedCompetitor2 = winnerId;
    }

    if (updatedCompetitor1 && updatedCompetitor2 && nextStatus === 'locked') {
      nextStatus = 'ready';
    }

    await bracketRepository.updateMatchCompetitorsAndStatus(
      nextWinnerMatchId,
      updatedCompetitor1,
      updatedCompetitor2,
      nextStatus,
      client
    );
  }

  _getWinnerAndLoserPaths(nextMatches, groupsMap) {
    let nextWinnerMatch = null;
    let nextLoserMatch = null;

    for (const nextMatch of nextMatches) {
      const group = groupsMap.get(nextMatch.group_id);
      if (!group) continue;

      if (group.number === 1 || group.number === 3) {
        nextWinnerMatch = nextMatch;
      } else if (group.number === 2) {
        nextLoserMatch = nextMatch;
      }
    }

    if (nextMatches.length === 1 && !nextWinnerMatch) {
      nextWinnerMatch = nextMatches[0];
    }

    return { nextWinnerMatch, nextLoserMatch };
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
