const test = require('node:test');
const assert = require('node:assert/strict');
const {
  TournamentRankingService,
} = require('../src/modules/tournament/service/ranking.service');

const TOUR_ID = '00000000-0000-0000-0000-000000000001';
const COMP_A = '00000000-0000-0000-0000-00000000000a';
const COMP_B = '00000000-0000-0000-0000-00000000000b';
const COMP_C = '00000000-0000-0000-0000-00000000000c';
const COMP_D = '00000000-0000-0000-0000-00000000000d';
let matchSequence = 0;

const competitors = [
  { comp_id: COMP_A, comp_name: 'Alpha', comp_logo: null, comp_size: 1 },
  { comp_id: COMP_B, comp_name: 'Beta', comp_logo: null, comp_size: 1 },
  { comp_id: COMP_C, comp_name: 'Charlie', comp_logo: null, comp_size: 1 },
  { comp_id: COMP_D, comp_name: 'Delta', comp_logo: null, comp_size: 1 },
];

const teamCompetitors = [
  { comp_id: COMP_A, comp_name: 'Sentinels', comp_logo: null, comp_size: 5 },
  { comp_id: COMP_B, comp_name: 'Paper Rex', comp_logo: null, comp_size: 5 },
];

const tournament = (overrides = {}) => ({
  tour_id: TOUR_ID,
  tour_format: 'round_robin',
  tour_status: 'ongoing',
  group_count: 1,
  advance_per_group: 1,
  participant_type: 'individual',
  first_stage_format: null,
  second_stage_format: null,
  ...overrides,
});

const match = (overrides = {}) => ({
  match_id: `match-${matchSequence += 1}`,
  stage: 'round_robin',
  round: 1,
  group_name: 'Group A',
  status: 'completed',
  competitor1_id: COMP_A,
  competitor2_id: COMP_B,
  score1: 1,
  score2: 0,
  result1: 'win',
  result2: 'loss',
  winning_competitor_id: COMP_A,
  is_draw: false,
  next_winner_match_id: null,
  next_loser_match_id: null,
  round_scores: null,
  ...overrides,
});

const createService = (data) => new TournamentRankingService({
  getTournamentRankingData: async () => data,
});

test('rejects malformed tournament ids before querying the repository', async () => {
  let repositoryCalled = false;
  const service = new TournamentRankingService({
    getTournamentRankingData: async () => {
      repositoryCalled = true;
      return null;
    },
  });

  await assert.rejects(
    service.getTournamentRankings('not-a-uuid'),
    error => error.statusCode === 400 && error.message === 'Invalid tournament id.'
  );
  assert.equal(repositoryCalled, false);
});

test('returns 404 when the tournament does not exist', async () => {
  const service = createService(null);

  await assert.rejects(
    service.getTournamentRankings(TOUR_ID),
    error => error.statusCode === 404 && error.message === 'Tournament not found.'
  );
});

test('returns every competitor as pending before matches are generated', async () => {
  const service = createService({
    tournament: tournament(),
    competitors: competitors.slice(0, 3),
    matches: [],
  });

  const result = await service.getTournamentRankings(TOUR_ID);

  assert.equal(result.state, 'not_started');
  assert.equal(result.rankings.length, 3);
  assert.ok(result.rankings.every(row => row.rank === null && row.status === 'pending'));
  assert.deepEqual(result.groups, []);
});

test('returns an empty ranking set when a tournament has no competitors', async () => {
  const service = createService({
    tournament: tournament(),
    competitors: [],
    matches: [],
  });

  const result = await service.getTournamentRankings(TOUR_ID);

  assert.equal(result.state, 'no_competitors');
  assert.deepEqual(result.rankings, []);
  assert.deepEqual(result.groups, []);
});

test('ranks team competitors as teams without creating ranking rows for their players', async () => {
  const service = createService({
    tournament: tournament({ participant_type: 'team' }),
    competitors: teamCompetitors,
    matches: [
      match({
        competitor1_id: COMP_A,
        competitor2_id: COMP_B,
        winning_competitor_id: COMP_A,
      }),
    ],
  });

  const result = await service.getTournamentRankings(TOUR_ID);

  assert.equal(result.participant_type, 'team');
  assert.equal(result.competitive_unit, 'team');
  assert.deepEqual(result.rankings.map(row => row.comp_name), ['Sentinels', 'Paper Rex']);
  assert.ok(result.rankings.every(row => row.entity_type === 'team'));
  assert.equal(result.rankings.length, 2);
});

test('ranks only completed round-robin results and applies deterministic group tie-breaks', async () => {
  const service = createService({
    tournament: tournament({ advance_per_group: 1 }),
    competitors: competitors.slice(0, 3),
    matches: [
      match({ score1: 2, score2: 0 }),
      match({
        match_id: 'draw',
        competitor2_id: COMP_C,
        score1: 1,
        score2: 1,
        result1: 'draw',
        result2: 'draw',
        winning_competitor_id: null,
        is_draw: true,
      }),
      match({
        match_id: 'unfinished',
        competitor1_id: COMP_B,
        competitor2_id: COMP_C,
        status: 'ready',
        score1: null,
        score2: null,
        result1: null,
        result2: null,
        winning_competitor_id: null,
      }),
    ],
  });

  const result = await service.getTournamentRankings(TOUR_ID);
  const group = result.groups[0];

  assert.equal(result.state, 'in_progress');
  assert.deepEqual(group.rankings.map(row => row.comp_id), [COMP_A, COMP_C, COMP_B]);
  assert.deepEqual(group.rankings.map(row => row.points), [4, 1, 0]);
  assert.equal(group.rankings[0].advanced, true);
  assert.equal(group.rankings[1].advanced, false);
  assert.equal(group.rankings[2].played, 1);
});

test('breaks equal round-robin records by competitor name without advancing extra competitors', async () => {
  const service = createService({
    tournament: tournament({ advance_per_group: 1 }),
    competitors,
    matches: [
      match({
        match_id: 'draw-a-b',
        score1: 0,
        score2: 0,
        result1: 'draw',
        result2: 'draw',
        winning_competitor_id: null,
        is_draw: true,
      }),
      match({
        match_id: 'draw-c-d',
        competitor1_id: COMP_C,
        competitor2_id: COMP_D,
        score1: 0,
        score2: 0,
        result1: 'draw',
        result2: 'draw',
        winning_competitor_id: null,
        is_draw: true,
      }),
    ],
  });

  const result = await service.getTournamentRankings(TOUR_ID);
  const rankings = result.groups[0].rankings;

  assert.deepEqual(rankings.map(row => row.comp_name), ['Alpha', 'Beta', 'Charlie', 'Delta']);
  assert.deepEqual(rankings.map(row => row.rank), [1, 2, 3, 4]);
  assert.equal(rankings.filter(row => row.advanced).length, 1);
});

test('uses the latest completed round-scoring ranking and appends absent competitors as pending', async () => {
  const service = createService({
    tournament: tournament({ tour_format: 'round_scoring' }),
    competitors: competitors.slice(0, 3),
    matches: [
      match({
        match_id: 'round-1',
        stage: 'round_scoring',
        round: 1,
        competitor1_id: null,
        competitor2_id: null,
        winning_competitor_id: null,
        result1: null,
        result2: null,
        round_scores: [
          { comp_id: COMP_A, score: 10, rank: 1, advanced: true, eliminated: false },
          { comp_id: COMP_B, score: 8, rank: 2, advanced: true, eliminated: false },
        ],
      }),
      match({
        match_id: 'round-2',
        stage: 'round_scoring',
        round: 2,
        competitor1_id: null,
        competitor2_id: null,
        winning_competitor_id: null,
        result1: null,
        result2: null,
        round_scores: JSON.stringify([
          { comp_id: COMP_B, score: 20, rank: 1, advanced: true, eliminated: false },
          { comp_id: COMP_A, score: 15, rank: 2, advanced: false, eliminated: true },
          { comp_id: COMP_A, score: 999, rank: 3, advanced: true, eliminated: false },
        ]),
      }),
    ],
  });

  const result = await service.getTournamentRankings(TOUR_ID);

  assert.equal(result.state, 'completed');
  assert.equal(result.stages[0].round, 2);
  assert.deepEqual(result.rankings.map(row => row.comp_id), [COMP_B, COMP_A, COMP_C]);
  assert.deepEqual(result.rankings.map(row => row.score), [20, 15, null]);
  assert.equal(result.rankings[1].status, 'eliminated');
  assert.equal(result.rankings[2].rank, null);
});

test('places a completed elimination champion first and does not count byes as played matches', async () => {
  const service = createService({
    tournament: tournament({ tour_format: 'single_elimination' }),
    competitors,
    matches: [
      match({
        match_id: 'semi-1',
        stage: 'single_elimination',
        round: 1,
        competitor1_id: COMP_A,
        competitor2_id: COMP_C,
        next_winner_match_id: 'final',
      }),
      match({
        match_id: 'semi-2',
        stage: 'single_elimination',
        round: 1,
        competitor1_id: COMP_B,
        competitor2_id: COMP_D,
        next_winner_match_id: 'final',
        winning_competitor_id: COMP_B,
      }),
      match({
        match_id: 'final',
        stage: 'single_elimination',
        round: 2,
        competitor1_id: COMP_A,
        competitor2_id: COMP_B,
        score1: 0,
        score2: 1,
        result1: 'loss',
        result2: 'win',
        winning_competitor_id: COMP_B,
      }),
      match({
        match_id: 'consolation',
        stage: 'single_elimination',
        round: 2,
        group_name: 'Consolation Final',
        competitor1_id: COMP_C,
        competitor2_id: COMP_D,
        winning_competitor_id: COMP_C,
      }),
      match({
        match_id: 'bye',
        stage: 'single_elimination',
        status: 'bye',
        competitor1_id: COMP_A,
        competitor2_id: null,
        winning_competitor_id: COMP_A,
      }),
    ],
  });

  const result = await service.getTournamentRankings(TOUR_ID);
  const champion = result.rankings[0];
  const alpha = result.rankings.find(row => row.comp_id === COMP_A);

  assert.equal(result.state, 'completed');
  assert.equal(champion.comp_id, COMP_B);
  assert.equal(champion.status, 'champion');
  assert.equal(alpha.played, 2);
});

test('prioritizes stage-two placement in hybrid overall rankings and retains stage-one groups', async () => {
  const service = createService({
    tournament: tournament({
      tour_format: 'hybrid',
      first_stage_format: 'round_robin',
      second_stage_format: 'single_elimination',
      advance_per_group: 2,
    }),
    competitors: competitors.slice(0, 3),
    matches: [
      match({ match_id: 's1-a-b', stage: 'stage_1', winning_competitor_id: COMP_A }),
      match({
        match_id: 's1-a-c',
        stage: 'stage_1',
        competitor2_id: COMP_C,
        winning_competitor_id: COMP_A,
      }),
      match({
        match_id: 's1-b-c',
        stage: 'stage_1',
        competitor1_id: COMP_B,
        competitor2_id: COMP_C,
        winning_competitor_id: COMP_B,
      }),
      match({
        match_id: 's2-final',
        stage: 'stage_2',
        round: 1,
        group_name: 'Bracket',
        competitor1_id: COMP_A,
        competitor2_id: COMP_B,
        score1: 0,
        score2: 1,
        result1: 'loss',
        result2: 'win',
        winning_competitor_id: COMP_B,
      }),
    ],
  });

  const result = await service.getTournamentRankings(TOUR_ID);
  const stageTwo = result.stages.find(stage => stage.stage === 'stage_2');

  assert.equal(result.current_stage, 'stage_2');
  assert.deepEqual(result.rankings.map(row => row.comp_id), [COMP_B, COMP_A, COMP_C]);
  assert.deepEqual(stageTwo.rankings.map(row => row.comp_id), [COMP_B, COMP_A]);
  assert.equal(stageTwo.rankings[0].status, 'champion');
  assert.equal(result.groups[0].rankings.length, 3);
});

test('ignores completed rows with unknown competitors or unusable results', async () => {
  const service = createService({
    tournament: tournament(),
    competitors: competitors.slice(0, 2),
    matches: [
      match({
        competitor2_id: '00000000-0000-0000-0000-000000000099',
        winning_competitor_id: '00000000-0000-0000-0000-000000000099',
      }),
      match({
        match_id: 'missing-result',
        score1: 0,
        score2: 0,
        result1: null,
        result2: null,
        winning_competitor_id: null,
        is_draw: false,
      }),
    ],
  });

  const result = await service.getTournamentRankings(TOUR_ID);

  assert.ok(result.rankings.every(row => row.played === 0 && row.rank === null));
});
