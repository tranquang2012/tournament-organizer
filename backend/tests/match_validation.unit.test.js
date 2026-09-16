const test = require('node:test');
const assert = require('node:assert/strict');
const matchesService = require('../src/modules/matches/service/matches.service');
const matchesRepository = require('../src/modules/matches/repository/matches.repository');
const { validateCreateTournamentDto } = require('../src/modules/tournament/dto/createTournament.dto');
const pool = require('../src/shared/database/pool');

test('scheduleMatch rejects dates in the past', async () => {
  const origGetMatchBase = matchesRepository.getMatchBase;
  matchesRepository.getMatchBase = async () => ({
    match_id: 'm-1',
    tour_id: 't-1',
    status: 'ready',
  });

  try {
    const pastStart = new Date(Date.now() - 3600 * 1000).toISOString();
    const pastEnd = new Date(Date.now() - 1800 * 1000).toISOString();

    await assert.rejects(
      () => matchesService.scheduleMatch('m-1', { scheduled_start: pastStart, scheduled_end: pastEnd }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /past/i);
        return true;
      }
    );
  } finally {
    matchesRepository.getMatchBase = origGetMatchBase;
  }
});

test('scheduleMatch rejects dates before tournament start date', async () => {
  const origGetMatchBase = matchesRepository.getMatchBase;
  const origQuery = pool.query;

  matchesRepository.getMatchBase = async () => ({
    match_id: 'm-1',
    tour_id: 't-1',
    status: 'ready',
  });

  pool.query = async (sql) => {
    if (sql.includes('FROM tournament')) {
      return {
        rows: [{
          tour_startdate: '2030-05-15',
          tour_enddate: '2030-05-20',
        }],
      };
    }
    return { rows: [] };
  };

  try {
    const earlyStart = '2030-05-14T10:00:00.000Z';
    const earlyEnd = '2030-05-14T11:00:00.000Z';

    await assert.rejects(
      () => matchesService.scheduleMatch('m-1', { scheduled_start: earlyStart, scheduled_end: earlyEnd }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /before tournament start date/i);
        return true;
      }
    );
  } finally {
    matchesRepository.getMatchBase = origGetMatchBase;
    pool.query = origQuery;
  }
});

test('scheduleMatch rejects dates after tournament end date', async () => {
  const origGetMatchBase = matchesRepository.getMatchBase;
  const origQuery = pool.query;

  matchesRepository.getMatchBase = async () => ({
    match_id: 'm-1',
    tour_id: 't-1',
    status: 'ready',
  });

  pool.query = async (sql) => {
    if (sql.includes('FROM tournament')) {
      return {
        rows: [{
          tour_startdate: '2030-05-15',
          tour_enddate: '2030-05-20',
        }],
      };
    }
    return { rows: [] };
  };

  try {
    const lateStart = '2030-05-22T10:00:00.000Z';
    const lateEnd = '2030-05-22T11:00:00.000Z';

    await assert.rejects(
      () => matchesService.scheduleMatch('m-1', { scheduled_start: lateStart, scheduled_end: lateEnd }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /after tournament end date/i);
        return true;
      }
    );
  } finally {
    matchesRepository.getMatchBase = origGetMatchBase;
    pool.query = origQuery;
  }
});

test('updateMatch rejects draws in elimination format', async () => {
  const origConnect = pool.connect;

  const mockClient = {
    query: async (sql) => {
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return;
      if (sql.includes('FROM matches m') && sql.includes('JOIN tournament t')) {
        return {
          rows: [{
            tour_format: 'single_elimination',
            sp_id: 1, // Football, but elimination
            next_winner_match_id: 'm-next',
            stage: 'knockout',
          }],
        };
      }
      return { rows: [] };
    },
    release: () => {},
  };

  pool.connect = async () => mockClient;
  const origGetMatchBase = matchesRepository.getMatchBase;
  matchesRepository.getMatchBase = async () => ({
    match_id: 'm-1',
    tour_id: 't-1',
    competitor1_id: 'c-1',
    competitor2_id: 'c-2',
    status: 'running',
  });

  try {
    await assert.rejects(
      () => matchesService.updateMatch('m-1', {
        score1: 1,
        score2: 1,
        is_draw: true,
        status: 'completed',
      }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Elimination matches cannot end in a draw/i);
        return true;
      }
    );
  } finally {
    pool.connect = origConnect;
    matchesRepository.getMatchBase = origGetMatchBase;
  }
});

test('updateMatch rejects draws for non-football sports even in round robin', async () => {
  const origConnect = pool.connect;

  const mockClient = {
    query: async (sql) => {
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return;
      if (sql.includes('FROM matches m') && sql.includes('JOIN tournament t')) {
        return {
          rows: [{
            tour_format: 'round_robin',
            sp_id: 2, // Basketball
            next_winner_match_id: null,
            next_loser_match_id: null,
            stage: 'group',
          }],
        };
      }
      return { rows: [] };
    },
    release: () => {},
  };

  pool.connect = async () => mockClient;
  const origGetMatchBase = matchesRepository.getMatchBase;
  matchesRepository.getMatchBase = async () => ({
    match_id: 'm-2',
    tour_id: 't-2',
    competitor1_id: 'c-1',
    competitor2_id: 'c-2',
    status: 'running',
  });

  try {
    await assert.rejects(
      () => matchesService.updateMatch('m-2', {
        score1: 80,
        score2: 80,
        is_draw: true,
        status: 'completed',
      }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /cannot end in a draw/i);
        return true;
      }
    );
  } finally {
    pool.connect = origConnect;
    matchesRepository.getMatchBase = origGetMatchBase;
  }
});

test('validateCreateTournamentDto rejects start_date in the past', () => {
  const result = validateCreateTournamentDto({
    tournament_name: 'Past Cup',
    start_date: '2020-01-01',
    end_date: '2020-01-05',
  });
  assert.ok(result.errors);
  assert.ok(result.errors.some((e) => /past/i.test(e)));
});

test('validateCreateTournamentDto accepts today or future start_date', () => {
  const futureStart = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const futureEnd = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const result = validateCreateTournamentDto({
    tournament_name: 'Future Cup',
    start_date: futureStart,
    end_date: futureEnd,
  });
  assert.equal(result.errors, null);
  assert.equal(result.data.tour_name, 'Future Cup');
});

