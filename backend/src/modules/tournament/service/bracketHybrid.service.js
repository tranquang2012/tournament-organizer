const pool = require('../../../shared/database/pool');
const AppError = require('../../../shared/errors/AppError');
const bracketRepository = require('../repository/bracket.repository');

class BracketHybridService {
  constructor(standardService, roundScoringService) {
    this.standardService = standardService;
    this.roundScoringService = roundScoringService;
  }

  async generateHybridBracket(tourId, tournament) {
    const structure = this.getHybridStructure(tournament);
    const firstStage = structure.stages[0];

    const competitors = await bracketRepository.getCompetitorsForSeeding(tourId);
    if (competitors.length < 2) {
      throw new AppError('At least 2 competitors are required to generate matches.', 400);
    }

    const seeding = competitors.map(c => c.comp_id);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await bracketRepository.deleteMatchesByTournament(tourId, client);

      let result;
      if (firstStage.format === 'round_scoring') {
        const matchId = await bracketRepository.insertRoundScoringMatch(
          tourId,
          1,
          client,
          this.getStageKey(firstStage)
        );
        await client.query(
          `UPDATE matches SET status = 'ready' WHERE match_id = $1`,
          [matchId]
        );
        result = { totalMatches: 1 };
      } else {
        result = await this.standardService.generateBracketStage(tourId, {
          format: firstStage.format,
          seeding,
          groupCount: firstStage.group_count || 1,
          stageName: this.getStageKey(firstStage),
          client
        });
      }

      await client.query('COMMIT');
      return {
        format: 'hybrid',
        stage: 1,
        totalMatches: result.totalMatches,
        structure
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async ensureHybridStageTwoGenerated(tourId) {
    const tournament = await bracketRepository.getTournamentFormat(tourId);
    if (!tournament || tournament.tour_format !== 'hybrid') return null;

    const structure = this.getHybridStructure(tournament);
    const [firstStage, secondStage] = structure.stages;
    if (!secondStage) return null;

    const stageTwoKey = this.getStageKey(secondStage);
    const stageTwoExists = await bracketRepository.hasMatchesForStage(tourId, stageTwoKey);
    if (stageTwoExists) return null;

    const qualifiers = await this._getHybridQualifiers(tourId, firstStage);
    const expectedQualifiers = this._getExpectedQualifierCount(firstStage);
    if (qualifiers.length < 2 || qualifiers.length < expectedQualifiers) return null;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existingStageTwo = await bracketRepository.hasMatchesForStage(tourId, stageTwoKey, client);
      if (existingStageTwo) {
        await client.query('COMMIT');
        return null;
      }

      let result;
      if (secondStage.format === 'round_scoring') {
        const matchId = await bracketRepository.insertRoundScoringMatch(tourId, 2, client, stageTwoKey);
        await client.query(
          `UPDATE matches SET status = 'ready' WHERE match_id = $1`,
          [matchId]
        );
        result = { totalMatches: 1 };
      } else {
        result = await this.standardService.generateBracketStage(tourId, {
          format: secondStage.format,
          seeding: qualifiers,
          groupCount: secondStage.group_count || 1,
          stageName: stageTwoKey,
          client
        });
      }

      await client.query('COMMIT');
      return {
        format: 'hybrid',
        stage: 2,
        totalMatches: result.totalMatches,
        qualifiers
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  getHybridStructure(tournament) {
    const firstStageFormat = tournament.first_stage_format || 'round_robin';
    const secondStageFormat = tournament.second_stage_format || 'single_elimination';
    return {
      type: 'hybrid',
      max_stages: 2,
      stages: [
        {
          stage_number: 1,
          name: firstStageFormat === 'round_scoring' ? 'Scoring Stage' : 'Group Stage',
          format: firstStageFormat,
          stage_key: 'stage_1',
          group_count: tournament.group_count || 1,
          advance_per_group: tournament.advance_per_group || 1,
        },
        {
          stage_number: 2,
          name: 'Final Stage',
          format: secondStageFormat,
          stage_key: 'stage_2',
        },
      ],
    };
  }

  getStageKey(stage) {
    return stage.stage_key || `stage_${stage.stage_number || 1}`;
  }

  _parseArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    }
    return [];
  }

  _getExpectedQualifierCount(firstStage) {
    if (firstStage.format === 'round_scoring') {
      return firstStage.advance_per_group || 3;
    }
    return (firstStage.group_count || 1) * (firstStage.advance_per_group || 1);
  }

  async _getHybridQualifiers(tourId, firstStage) {
    if (firstStage.format === 'round_scoring') {
      const rounds = await bracketRepository.getRoundScoringMatchesByStage(
        tourId,
        this.getStageKey(firstStage)
      );
      const firstRound = rounds.find(r => r.round === 1);
      const roundScores = this._parseArray(firstRound?.round_scores);
      if (!firstRound || firstRound.status !== 'completed' || !roundScores.length) {
        return [];
      }
      return roundScores
        .filter(r => r.advanced)
        .sort((a, b) => a.rank - b.rank)
        .map(r => r.comp_id);
    }

    if (firstStage.format !== 'round_robin') {
      throw new AppError(`Hybrid stage 1 format '${firstStage.format}' is not supported.`, 400);
    }

    const matches = await bracketRepository.getMatchesByTournamentAndStage(
      tourId,
      this.getStageKey(firstStage)
    );
    if (!matches.length || matches.some(m => !['completed', 'bye'].includes(m.status))) {
      return [];
    }

    const groups = new Map();
    const ensureCompetitor = (groupName, compId, compName) => {
      if (!compId) return null;
      if (!groups.has(groupName)) groups.set(groupName, new Map());
      const group = groups.get(groupName);
      if (!group.has(compId)) {
        group.set(compId, {
          comp_id: compId,
          comp_name: compName || '',
          points: 0,
          wins: 0,
          draws: 0,
          score_for: 0,
          score_against: 0,
        });
      }
      return group.get(compId);
    };

    for (const match of matches) {
      const groupName = match.group_name || 'Group A';
      const comp1 = ensureCompetitor(groupName, match.competitor1_id, match.c1_name);
      const comp2 = ensureCompetitor(groupName, match.competitor2_id, match.c2_name);
      if (!comp1 || !comp2) continue;

      const score1 = match.score1 || 0;
      const score2 = match.score2 || 0;
      comp1.score_for += score1;
      comp1.score_against += score2;
      comp2.score_for += score2;
      comp2.score_against += score1;

      if (match.is_draw) {
        comp1.points += 1;
        comp2.points += 1;
        comp1.draws += 1;
        comp2.draws += 1;
      } else if (match.winning_competitor_id === comp1.comp_id) {
        comp1.points += 3;
        comp1.wins += 1;
      } else if (match.winning_competitor_id === comp2.comp_id) {
        comp2.points += 3;
        comp2.wins += 1;
      }
    }

    const advancePerGroup = firstStage.advance_per_group || 1;
    const qualifiers = [];

    for (const group of groups.values()) {
      const ranked = Array.from(group.values()).sort((a, b) => (
        b.points - a.points ||
        b.wins - a.wins ||
        (b.score_for - b.score_against) - (a.score_for - a.score_against) ||
        b.score_for - a.score_for ||
        a.comp_name.localeCompare(b.comp_name)
      ));
      qualifiers.push(...ranked.slice(0, advancePerGroup).map(r => r.comp_id));
    }

    return qualifiers;
  }
}

// We will export a factory function to inject dependencies
module.exports = BracketHybridService;
