const AppError = require('../../../shared/errors/AppError');
const rankingRepository = require('../repository/ranking.repository');

const RESULT_STATUSES = new Set(['completed', 'resolved', 'archived']);
const TERMINAL_STATUSES = new Set([...RESULT_STATUSES, 'bye']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FORMAT_TYPES = {
  round_robin: 'standings',
  round_scoring: 'score',
  single_elimination: 'elimination',
  double_elimination: 'elimination',
  hybrid: 'hybrid',
};

const getParticipantType = (tournament, competitors) => {
  if (['individual', 'team'].includes(tournament.participant_type)) {
    return tournament.participant_type;
  }

  return competitors.some(competitor => Number(competitor.comp_size) > 1)
    ? 'team'
    : 'individual';
};

const decorateRankingResponse = (response, participantType) => {
  const decorateRows = (rows = []) => rows.map(row => ({
    ...row,
    entity_type: participantType,
  }));
  const decorateGroups = (groups = []) => groups.map(group => ({
    ...group,
    rankings: decorateRows(group.rankings),
  }));

  return {
    ...response,
    participant_type: participantType,
    competitive_unit: participantType,
    rankings: decorateRows(response.rankings),
    groups: decorateGroups(response.groups),
    current_stage_rankings: response.current_stage_rankings
      ? decorateRows(response.current_stage_rankings)
      : undefined,
    stages: (response.stages || []).map(stage => ({
      ...stage,
      rankings: decorateRows(stage.rankings),
      groups: decorateGroups(stage.groups),
    })),
  };
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

const createRecord = (competitor) => ({
  rank: null,
  comp_id: competitor.comp_id,
  comp_name: competitor.comp_name || 'Unknown',
  comp_logo: competitor.comp_logo || null,
  comp_size: competitor.comp_size ?? null,
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  points: 0,
  score_for: 0,
  score_against: 0,
  score_difference: 0,
  win_rate: 0,
  status: 'pending',
});

const getResult = (match) => {
  if (!RESULT_STATUSES.has(match.status)) return null;

  const comp1Id = match.competitor1_id;
  const comp2Id = match.competitor2_id;
  if (!comp1Id || !comp2Id || comp1Id === comp2Id) return null;

  if (match.is_draw === true || (match.result1 === 'draw' && match.result2 === 'draw')) {
    return { type: 'draw', winnerId: null };
  }

  if (match.winning_competitor_id === comp1Id || match.result1 === 'win') {
    return { type: 'win', winnerId: comp1Id };
  }
  if (match.winning_competitor_id === comp2Id || match.result2 === 'win') {
    return { type: 'win', winnerId: comp2Id };
  }

  const score1 = toNumber(match.score1);
  const score2 = toNumber(match.score2);
  if (score1 !== null && score2 !== null && score1 !== score2) {
    return { type: 'win', winnerId: score1 > score2 ? comp1Id : comp2Id };
  }

  return null;
};

const applyMatch = (records, match) => {
  const comp1 = records.get(match.competitor1_id);
  const comp2 = records.get(match.competitor2_id);
  const result = getResult(match);
  if (!comp1 || !comp2 || !result) return false;

  const score1 = toNumber(match.score1) ?? 0;
  const score2 = toNumber(match.score2) ?? 0;

  comp1.played += 1;
  comp2.played += 1;
  comp1.score_for += score1;
  comp1.score_against += score2;
  comp2.score_for += score2;
  comp2.score_against += score1;

  if (result.type === 'draw') {
    comp1.draws += 1;
    comp2.draws += 1;
    comp1.points += 1;
    comp2.points += 1;
  } else {
    const winner = result.winnerId === comp1.comp_id ? comp1 : comp2;
    const loser = winner === comp1 ? comp2 : comp1;
    winner.wins += 1;
    winner.points += 3;
    loser.losses += 1;
  }

  return true;
};

const finalizeRecord = (record) => ({
  ...record,
  score_difference: record.score_for - record.score_against,
  win_rate: record.played > 0
    ? Number(((record.wins / record.played) * 100).toFixed(2))
    : 0,
  status: record.played > 0 && record.status === 'pending' ? 'active' : record.status,
});

const standingsMetrics = (record) => [
  record.points,
  record.wins,
  record.score_difference,
  record.score_for,
  record.played,
];

const compareStandings = (a, b) => (
  b.points - a.points ||
  b.wins - a.wins ||
  b.score_difference - a.score_difference ||
  b.score_for - a.score_for ||
  b.played - a.played ||
  a.comp_name.localeCompare(b.comp_name) ||
  a.comp_id.localeCompare(b.comp_id)
);

const sameMetrics = (a, b, metricSelector) => {
  const aMetrics = metricSelector(a);
  const bMetrics = metricSelector(b);
  return aMetrics.length === bMetrics.length
    && aMetrics.every((value, index) => value === bMetrics[index]);
};

const assignCompetitionRanks = (records, metricSelector, { unrankPending = true } = {}) => {
  let lastRanked = null;
  let currentRank = 0;

  return records.map((record, index) => {
    if (unrankPending && record.played === 0) {
      return { ...record, rank: null };
    }

    if (!lastRanked || !sameMetrics(record, lastRanked, metricSelector)) {
      currentRank = index + 1;
    }
    lastRanked = record;
    return { ...record, rank: currentRank };
  });
};

const buildRecords = (competitors, matches) => {
  const records = new Map(competitors.map(competitor => [
    competitor.comp_id,
    createRecord(competitor),
  ]));

  for (const match of matches) {
    applyMatch(records, match);
  }

  return records;
};

const rankStandings = (competitors, matches, { includeAll = true } = {}) => {
  const records = buildRecords(competitors, matches);
  let standings = Array.from(records.values())
    .map(finalizeRecord)
    .sort(compareStandings);

  if (!includeAll) {
    const participantIds = new Set();
    for (const match of matches) {
      if (match.competitor1_id) participantIds.add(match.competitor1_id);
      if (match.competitor2_id) participantIds.add(match.competitor2_id);
    }
    standings = standings.filter(record => participantIds.has(record.comp_id));
  }

  return assignCompetitionRanks(standings, standingsMetrics);
};

const buildGroupStandings = (competitors, matches, advancePerGroup) => {
  const competitorMap = new Map(competitors.map(c => [c.comp_id, c]));
  const groupedMatches = new Map();

  for (const match of matches) {
    const groupName = match.group_name || 'Group A';
    if (!groupedMatches.has(groupName)) groupedMatches.set(groupName, []);
    groupedMatches.get(groupName).push(match);
  }

  return Array.from(groupedMatches.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupName, groupMatches]) => {
      const groupCompetitorIds = new Set();
      for (const match of groupMatches) {
        if (competitorMap.has(match.competitor1_id)) groupCompetitorIds.add(match.competitor1_id);
        if (competitorMap.has(match.competitor2_id)) groupCompetitorIds.add(match.competitor2_id);
      }

      const groupCompetitors = Array.from(groupCompetitorIds)
        .map(compId => competitorMap.get(compId));
      const rankings = rankStandings(groupCompetitors, groupMatches)
        .map((record, index) => ({
          ...record,
          rank: record.played > 0 ? index + 1 : null,
          group_name: groupName,
          advanced: Number(advancePerGroup) > 0
            ? record.played > 0 && index < Number(advancePerGroup)
            : false,
        }));

      return { group_name: groupName, rankings };
    });
};

const getTournamentState = (competitors, matches, { hybrid = false } = {}) => {
  if (competitors.length === 0) return 'no_competitors';
  if (matches.length === 0) return 'not_started';

  const completedCount = matches.filter(match => RESULT_STATUSES.has(match.status)).length;
  if (completedCount === 0) return 'not_started';

  const allTerminal = matches.every(match => TERMINAL_STATUSES.has(match.status));
  if (hybrid && !matches.some(match => match.stage === 'stage_2')) return 'in_progress';
  return allTerminal ? 'completed' : 'in_progress';
};

const getStageFormat = (tournament, stage) => {
  if (tournament.tour_format !== 'hybrid') return tournament.tour_format;
  if (stage === 'stage_1') return tournament.first_stage_format || 'round_robin';
  if (stage === 'stage_2') return tournament.second_stage_format || 'single_elimination';
  return null;
};

const getChampionId = (format, matches) => {
  if (!['single_elimination', 'double_elimination'].includes(format)) return null;

  const finalGroup = format === 'double_elimination' ? 'Grand Final' : 'Bracket';
  const terminalMatches = matches
    .filter(match => (
      RESULT_STATUSES.has(match.status) &&
      !match.next_winner_match_id &&
      getResult(match)?.type === 'win'
    ));
  const namedFinals = terminalMatches.filter(match => match.group_name === finalGroup);
  const fallbackFinals = terminalMatches.filter(match => (
    !String(match.group_name || '').toLowerCase().includes('consolation')
  ));
  const finalCandidates = (namedFinals.length > 0 ? namedFinals : fallbackFinals)
    .sort((a, b) => (
      Number(b.round || 0) - Number(a.round || 0) ||
      String(b.match_id).localeCompare(String(a.match_id))
    ));

  return finalCandidates[0]?.winning_competitor_id || getResult(finalCandidates[0] || {})?.winnerId || null;
};

const eliminationMetrics = (record) => [
  record.status === 'champion' ? 3 : record.status === 'active' ? 2 : record.status === 'eliminated' ? 1 : 0,
  record.wins,
  -record.losses,
  record.score_difference,
  record.score_for,
  record.played,
];

const compareElimination = (a, b) => {
  const aMetrics = eliminationMetrics(a);
  const bMetrics = eliminationMetrics(b);
  for (let index = 0; index < aMetrics.length; index += 1) {
    if (aMetrics[index] !== bMetrics[index]) return bMetrics[index] - aMetrics[index];
  }
  return a.comp_name.localeCompare(b.comp_name) || a.comp_id.localeCompare(b.comp_id);
};

const rankElimination = (competitors, matches, format, { includeAll = true } = {}) => {
  const championId = getChampionId(format, matches);
  const lossLimit = format === 'double_elimination' ? 2 : 1;
  let rankings = rankStandings(competitors, matches, { includeAll })
    .map(record => {
      let status = 'pending';
      if (record.comp_id === championId) status = 'champion';
      else if (record.losses >= lossLimit) status = 'eliminated';
      else if (record.played > 0 || matches.some(match => (
        match.competitor1_id === record.comp_id || match.competitor2_id === record.comp_id
      ))) status = 'active';
      return { ...record, rank: null, status };
    })
    .sort(compareElimination);

  rankings = assignCompetitionRanks(rankings, eliminationMetrics);
  return rankings;
};

const buildScoreRankings = (competitors, matches) => {
  const competitorMap = new Map(competitors.map(c => [c.comp_id, c]));
  const completedRounds = matches
    .filter(match => RESULT_STATUSES.has(match.status))
    .sort((a, b) => Number(a.round || 0) - Number(b.round || 0));
  const latest = completedRounds[completedRounds.length - 1] || null;
  const savedScores = parseArray(latest?.round_scores);
  const seen = new Set();

  const rankedScores = savedScores
    .map((score, index) => {
      const competitor = competitorMap.get(score?.comp_id);
      const numericScore = toNumber(score?.score);
      if (!competitor || seen.has(competitor.comp_id) || numericScore === null) return null;
      seen.add(competitor.comp_id);
      return {
        rank: Number.isInteger(Number(score.rank)) && Number(score.rank) > 0
          ? Number(score.rank)
          : index + 1,
        comp_id: competitor.comp_id,
        comp_name: competitor.comp_name || 'Unknown',
        comp_logo: competitor.comp_logo || null,
        comp_size: competitor.comp_size ?? null,
        score: numericScore,
        status: score.eliminated ? 'eliminated' : score.advanced ? 'advanced' : 'active',
        advanced: Boolean(score.advanced),
        eliminated: Boolean(score.eliminated),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank || b.score - a.score || a.comp_name.localeCompare(b.comp_name));

  const pending = competitors
    .filter(competitor => !seen.has(competitor.comp_id))
    .map(competitor => ({
      rank: null,
      comp_id: competitor.comp_id,
      comp_name: competitor.comp_name || 'Unknown',
      comp_logo: competitor.comp_logo || null,
      comp_size: competitor.comp_size ?? null,
      score: null,
      status: 'pending',
      advanced: false,
      eliminated: false,
    }));

  return {
    round: latest?.round ?? null,
    rankings: [...rankedScores, ...pending],
  };
};

class TournamentRankingService {
  constructor(repository = rankingRepository) {
    this.repository = repository;
  }

  async getTournamentRankings(tourId) {
    if (!UUID_PATTERN.test(String(tourId || ''))) {
      throw new AppError('Invalid tournament id.', 400);
    }

    const data = await this.repository.getTournamentRankingData(tourId);
    if (!data) throw new AppError('Tournament not found.', 404);

    const { tournament, competitors, matches } = data;
    const participantType = getParticipantType(tournament, competitors);
    const rankingType = FORMAT_TYPES[tournament.tour_format] || 'standings';
    const state = getTournamentState(competitors, matches, {
      hybrid: tournament.tour_format === 'hybrid',
    });

    if (tournament.tour_format === 'hybrid') {
      const response = this._buildHybridResponse(tournament, competitors, matches, state);
      return decorateRankingResponse(response, participantType);
    }

    const stage = tournament.tour_format || null;
    const stageResponse = this._buildStageResponse(
      tournament,
      competitors,
      matches,
      stage,
      tournament.tour_format
    );

    return decorateRankingResponse({
      tournament_id: tournament.tour_id,
      tour_format: tournament.tour_format,
      ranking_type: rankingType,
      state,
      current_stage: stage,
      rankings: stageResponse.rankings,
      groups: stageResponse.groups,
      stages: stage ? [stageResponse] : [],
    }, participantType);
  }

  _buildHybridResponse(tournament, competitors, matches, state) {
    const stageOrder = ['stage_1', 'stage_2'];
    const availableStages = stageOrder.filter(stage => matches.some(match => match.stage === stage));
    const stages = availableStages.map(stage => {
      const stageMatches = matches.filter(match => match.stage === stage);
      return this._buildStageResponse(
        tournament,
        competitors,
        stageMatches,
        stage,
        getStageFormat(tournament, stage)
      );
    });

    const currentStage = availableStages.includes('stage_2') ? 'stage_2' : 'stage_1';
    const currentStageResponse = stages.find(stage => stage.stage === currentStage);
    const currentStageMap = new Map(
      (currentStageResponse?.rankings || []).map(record => [record.comp_id, record])
    );
    const overallRankings = rankStandings(competitors, matches)
      .map(record => {
        const reachedStageTwo = matches.some(match => (
          match.stage === 'stage_2' &&
          (match.competitor1_id === record.comp_id || match.competitor2_id === record.comp_id)
        ));
        const currentStageRecord = currentStageMap.get(record.comp_id);
        return {
          ...record,
          rank: null,
          reached_stage: reachedStageTwo ? 2 : 1,
          stage_rank: currentStageRecord?.rank ?? null,
          status: currentStageRecord?.status ||
            (currentStage === 'stage_2' ? 'eliminated' : record.status),
        };
      })
      .sort((a, b) => (
        b.reached_stage - a.reached_stage ||
        (
          a.reached_stage === 2 &&
          b.reached_stage === 2 &&
          (a.stage_rank ?? Number.MAX_SAFE_INTEGER) - (b.stage_rank ?? Number.MAX_SAFE_INTEGER)
        ) ||
        compareStandings(a, b)
      ));
    const rankedOverall = assignCompetitionRanks(
      overallRankings,
      record => [
        record.reached_stage,
        record.stage_rank === null ? 0 : -record.stage_rank,
        ...standingsMetrics(record),
      ]
    );

    return {
      tournament_id: tournament.tour_id,
      tour_format: tournament.tour_format,
      ranking_type: 'hybrid',
      state,
      current_stage: currentStage,
      rankings: rankedOverall,
      groups: stages.find(stage => stage.stage === 'stage_1')?.groups || [],
      stages,
      current_stage_rankings: currentStageResponse?.rankings || [],
    };
  }

  _buildStageResponse(tournament, competitors, matches, stage, format) {
    const participantIds = new Set();
    for (const match of matches) {
      if (match.competitor1_id) participantIds.add(match.competitor1_id);
      if (match.competitor2_id) participantIds.add(match.competitor2_id);
      for (const score of parseArray(match.round_scores)) {
        if (score?.comp_id) participantIds.add(score.comp_id);
      }
    }
    const stageCompetitors = tournament.tour_format === 'hybrid' && stage === 'stage_2'
      ? competitors.filter(competitor => participantIds.has(competitor.comp_id))
      : competitors;
    const state = getTournamentState(stageCompetitors, matches);

    if (format === 'round_scoring') {
      const scoreData = buildScoreRankings(stageCompetitors, matches);
      return {
        stage,
        format,
        state,
        round: scoreData.round,
        rankings: scoreData.rankings,
        groups: [],
      };
    }

    if (format === 'round_robin') {
      const groups = buildGroupStandings(
        stageCompetitors,
        matches,
        tournament.advance_per_group
      );
      return {
        stage,
        format,
        state,
        rankings: rankStandings(stageCompetitors, matches),
        groups,
      };
    }

    if (['single_elimination', 'double_elimination'].includes(format)) {
      return {
        stage,
        format,
        state,
        rankings: rankElimination(stageCompetitors, matches, format),
        groups: [],
      };
    }

    return {
      stage,
      format,
      state,
      rankings: rankStandings(stageCompetitors, matches),
      groups: [],
    };
  }
}

const service = new TournamentRankingService();

module.exports = service;
module.exports.TournamentRankingService = TournamentRankingService;
