const { InMemoryDatabase } = require('brackets-memory-db');
const { BracketsManager } = require('brackets-manager');
const AppError = require('../../../shared/errors/AppError');
const bracketRepository = require('../repository/bracket.repository');

class BracketStandardService {
  async generateBracketStage(tourId, { format, seeding, groupCount = 1, stageName = format, client }) {
    if (!['single_elimination', 'double_elimination', 'round_robin'].includes(format)) {
      throw new AppError(`Format '${format}' does not support bracket stage generation.`, 400);
    }

    const db = new InMemoryDatabase();
    const manager = new BracketsManager(db);

    let stageSize = seeding.length;
    if (format === 'single_elimination' || format === 'double_elimination') {
      stageSize = Math.pow(2, Math.ceil(Math.log2(seeding.length)));
      if (stageSize < 2) stageSize = 2;
    }

    const settings = {
      size: stageSize,
    };

    if (format === 'double_elimination') {
      settings.grandFinal = 'single';
    } else if (format === 'single_elimination') {
      settings.consolationFinal = stageSize > 2;
    } else if (format === 'round_robin') {
      settings.groupCount = groupCount || 1;
    }

    await manager.create.stage({
      tournamentId: 1,
      name: 'Bracket Stage',
      type: format,
      seeding,
      settings
    });

    const stageData = await manager.get.stageData(0);
    const matches = stageData.match;
    const participants = stageData.participant;
    const groups = stageData.group;

    const groupsMap = new Map(groups.map(g => [g.id, g]));
    const participantsMap = new Map(participants.map(p => [p.id, p]));

    const dbMatches = [];
    const memoryToDbIdMap = new Map();

    for (const m of matches) {
      const comp1_id = m.opponent1 && m.opponent1.id !== null ? participantsMap.get(m.opponent1.id)?.name : null;
      const comp2_id = m.opponent2 && m.opponent2.id !== null ? participantsMap.get(m.opponent2.id)?.name : null;

      const roundNum = m.round_id + 1;

      let status = 'locked';
      let winning_competitor_id = null;

      const isBye = (m.opponent1 === null && m.opponent2 !== null) || (m.opponent1 !== null && m.opponent2 === null);
      if (isBye) {
        status = 'bye';
        winning_competitor_id = (m.opponent1 !== null) ? comp1_id : comp2_id;
      } else if (m.status === 1) {
        status = 'waiting';
      } else if (m.status === 2) {
        status = 'ready';
      } else if (m.status === 3) {
        status = 'running';
      } else if (m.status === 4) {
        status = 'completed';
      } else if (m.status === 5) {
        status = 'archived';
      }

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

    for (const item of dbMatches) {
      const { memoryMatch, dbMatchId, winning_competitor_id, resolvedStatus } = item;

      let nextWinnerMatchId = null;
      let nextLoserMatchId = null;

      if (format !== 'round_robin') {
        const nextMemoryMatches = await manager.find.nextMatches(memoryMatch.id);

        if (nextMemoryMatches.length > 0) {
          const { nextWinnerMatch, nextLoserMatch } = this._getWinnerAndLoserPaths(memoryMatch, nextMemoryMatches, groupsMap);
          if (nextWinnerMatch) {
            nextWinnerMatchId = memoryToDbIdMap.get(nextWinnerMatch.id) || null;
          }
          if (nextLoserMatch) {
            nextLoserMatchId = memoryToDbIdMap.get(nextLoserMatch.id) || null;
          }
        }
      }

      await bracketRepository.updateProgressionReferences(dbMatchId, nextWinnerMatchId, nextLoserMatchId, client);

      if (resolvedStatus === 'bye' && winning_competitor_id && nextWinnerMatchId) {
        await this._propagateGeneratedBye(client, winning_competitor_id, nextWinnerMatchId);
      }
    }

    return { totalMatches: matches.length };
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

  _getWinnerAndLoserPaths(currentMatch, nextMatches, groupsMap) {
    const currentGroup = groupsMap.get(currentMatch.group_id);
    const currentGroupNumber = currentGroup ? currentGroup.number : 1;

    let nextWinnerMatch = null;
    let nextLoserMatch = null;

    if (currentGroupNumber === 1) {
      // Current match is in Upper Bracket
      for (const nextMatch of nextMatches) {
        const group = groupsMap.get(nextMatch.group_id);
        if (!group) continue;

        if (group.number === 1 || group.number === 3) {
          nextWinnerMatch = nextMatch;
        } else if (group.number === 2) {
          nextLoserMatch = nextMatch;
        }
      }
    } else if (currentGroupNumber === 2) {
      // Current match is in Lower Bracket
      // Winner goes to the next Lower Bracket match (group 2) or Grand Final (group 3)
      // Loser is eliminated
      for (const nextMatch of nextMatches) {
        const group = groupsMap.get(nextMatch.group_id);
        if (!group) continue;

        if (group.number === 2 || group.number === 3) {
          nextWinnerMatch = nextMatch;
        }
      }
    } else if (currentGroupNumber === 3) {
      // Grand Final
      for (const nextMatch of nextMatches) {
        const group = groupsMap.get(nextMatch.group_id);
        if (!group) continue;

        if (group.number === 3) {
          nextWinnerMatch = nextMatch;
        }
      }
    }

    return { nextWinnerMatch, nextLoserMatch };
  }
}

module.exports = new BracketStandardService();
