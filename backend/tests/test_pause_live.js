const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../src/shared/database/pool');
const tournamentService = require('../src/modules/tournament/service/tournament.service');
const AppError = require('../src/shared/errors/AppError');

const TOUR_ID = process.env.TEST_TOUR_ID_SINGLE_ELIM;

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

function dateOnlyString(value) {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(`${dateOnlyString(dateStr)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function pickPauseDate(startDate, endDate) {
  const start = new Date(`${dateOnlyString(startDate)}T00:00:00Z`);
  const end = new Date(`${dateOnlyString(endDate)}T00:00:00Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (today >= start && today < end) {
    return today.toISOString().slice(0, 10);
  }
  const candidate = new Date(start);
  candidate.setUTCDate(candidate.getUTCDate() + 1);
  if (candidate < end) {
    return candidate.toISOString().slice(0, 10);
  }
  const fallback = new Date(end);
  fallback.setUTCDate(fallback.getUTCDate() - 1);
  return fallback.toISOString().slice(0, 10);
}

async function columnExists(table, column) {
  const { rows } = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_name = $2`,
    [table, column]
  );
  return rows.length > 0;
}

async function loadTournament(tourId) {
  const { rows } = await pool.query(
    `SELECT tour_id, tour_status, tour_startdate, tour_enddate, tour_pausedate, created_by
     FROM tournament
     WHERE tour_id = $1`,
    [tourId]
  );
  return rows[0] || null;
}

async function loadMatches(tourId) {
  const { rows } = await pool.query(
    `SELECT match_id, status, scheduled_start, scheduled_end, tour_pausedate
     FROM matches
     WHERE tour_id = $1
     ORDER BY match_id`,
    [tourId]
  );
  return rows;
}

async function snapshotTournament(tourId) {
  const tournament = await loadTournament(tourId);
  const matches = await loadMatches(tourId);
  return { tournament, matches };
}

async function restoreSnapshot(snapshot) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const t = snapshot.tournament;
    await client.query(
      `UPDATE tournament
       SET tour_status = $1, tour_enddate = $2, tour_pausedate = $3
       WHERE tour_id = $4`,
      [t.tour_status, t.tour_enddate, t.tour_pausedate, t.tour_id]
    );
    for (const m of snapshot.matches) {
      await client.query(
        `UPDATE matches
         SET status = $1,
             scheduled_start = $2,
             scheduled_end = $3,
             tour_pausedate = $4,
             updated_at = NOW()
         WHERE match_id = $5`,
        [m.status, m.scheduled_start, m.scheduled_end, m.tour_pausedate, m.match_id]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function expectRejects(promise, messageFragment) {
  try {
    await promise;
    throw new Error(`Expected rejection containing "${messageFragment}"`);
  } catch (err) {
    if (err.message.startsWith('Expected rejection')) throw err;
    const msg = err.message || '';
    if (!msg.includes(messageFragment)) {
      throw new Error(`Expected rejection containing "${messageFragment}", got: ${msg}`);
    }
  }
}

async function run() {
  console.log('--- Tournament pause/resume live test ---\n');

  if (!TOUR_ID) {
    console.error('Error: TEST_TOUR_ID_SINGLE_ELIM is not set in backend/.env');
    process.exit(1);
  }

  const hasMatchPauseColumn = await columnExists('matches', 'tour_pausedate');
  if (!hasMatchPauseColumn) {
    console.error(
      'Error: matches.tour_pausedate column is missing. Add the migration before continuing.'
    );
    process.exit(1);
  }
  console.log('OK: matches.tour_pausedate column exists');

  const tournament = await loadTournament(TOUR_ID);
  if (!tournament) {
    console.error(`Error: Tournament ${TOUR_ID} not found.`);
    process.exit(1);
  }

  if (tournament.tour_status !== 'ongoing') {
    console.log(
      `SKIP: Tournament status is '${tournament.tour_status}', expected 'ongoing'. ` +
      'Use an ongoing test tournament without mutating it.'
    );
    process.exit(0);
  }

  const organizerId = tournament.created_by;
  const snapshot = await snapshotTournament(TOUR_ID);
  const pauseDate = pickPauseDate(tournament.tour_startdate, tournament.tour_enddate);
  const resumeDate = addDays(pauseDate, 2);

  console.log(`Tournament: ${TOUR_ID}`);
  console.log(`Organizer:  ${organizerId}`);
  console.log(`Pause date: ${pauseDate}`);
  console.log(`Resume date: ${resumeDate}\n`);

  try {
  // --- Rejection: resume while ongoing ---
  console.log('1. Reject resume while ongoing...');
  await expectRejects(
    tournamentService.resumeTournament(TOUR_ID, { resume_date: resumeDate }, organizerId),
    'already running'
  );
  console.log('   OK\n');

  // --- Pause ---
  console.log('2. Pause tournament...');
  const pauseResult = await tournamentService.pauseTournament(
    TOUR_ID,
    { pause_date: pauseDate },
    organizerId
  );
  assert(pauseResult.tour_status === 'paused', `expected paused, got ${pauseResult.tour_status}`);
  assert(pauseResult.tour_pausedate != null, 'tour_pausedate should be set');
  console.log(`   Status: ${pauseResult.tour_status}, matches paused: ${pauseResult.matches_paused}`);

  const pausedTournament = await loadTournament(TOUR_ID);
  assert(pausedTournament.tour_status === 'paused', 'DB tournament should be paused');
  assert(
    dateOnlyString(pausedTournament.tour_pausedate) === pauseDate,
    `pause date should remain ${pauseDate}`
  );

  const pausedMatches = await loadMatches(TOUR_ID);
  const activeBefore = snapshot.matches.filter(m =>
    ['ready', 'waiting', 'running'].includes(m.status)
  );
  for (const m of activeBefore) {
    const current = pausedMatches.find(row => row.match_id === m.match_id);
    assert(current, `match ${m.match_id} missing after pause`);
    assert(current.status === 'paused', `match ${m.match_id} should be paused`);
  }
  console.log('   OK\n');

  // --- Rejection: pause while already paused ---
  console.log('3. Reject pause while already paused...');
  await expectRejects(
    tournamentService.pauseTournament(TOUR_ID, { pause_date: pauseDate }, organizerId),
    'already paused'
  );
  console.log('   OK\n');

  // --- Rejection: resume_date <= pause_date ---
  console.log('4. Reject resume_date on or before pause_date...');
  const invalidResumeDate = addDays(pauseDate, -1);
  await expectRejects(
    tournamentService.resumeTournament(TOUR_ID, { resume_date: invalidResumeDate }, organizerId),
    'must be after the pause date'
  );
  console.log('   OK\n');

  // --- Resume ---
  console.log('5. Resume tournament...');
  const expectedDaysPaused = 2;

  const resumeResult = await tournamentService.resumeTournament(
    TOUR_ID,
    { resume_date: resumeDate },
    organizerId
  );
  assert(resumeResult.tour_status === 'ongoing', `expected ongoing, got ${resumeResult.tour_status}`);
  assert(
    resumeResult.days_paused === expectedDaysPaused,
    `expected ${expectedDaysPaused} days paused, got ${resumeResult.days_paused}`
  );
  assert(resumeResult.tour_pausedate === null, 'tour_pausedate should be cleared');

  const expectedEndDate = addDays(resumeResult.original_enddate, expectedDaysPaused);
  assert(
    dateOnlyString(resumeResult.new_enddate) === expectedEndDate,
    `end date should extend to ${expectedEndDate}, got ${dateOnlyString(resumeResult.new_enddate)}`
  );
  console.log(`   Status: ${resumeResult.tour_status}, days_paused: ${resumeResult.days_paused}`);
  console.log(`   Matches rescheduled: ${resumeResult.matches_rescheduled}`);
  console.log('   OK\n');

  // --- Restore snapshot ---
  console.log('6. Restore original tournament state...');
  await restoreSnapshot(snapshot);
  const restored = await loadTournament(TOUR_ID);
  assert(restored.tour_status === snapshot.tournament.tour_status, 'status restored');
  console.log('   OK\n');

  console.log('=================== ALL PAUSE TESTS PASSED ===================');
  } catch (err) {
    console.error('\nTest failed:', err.message);
    console.log('Attempting to restore snapshot...');
    try {
      await restoreSnapshot(snapshot);
      console.log('Snapshot restored.');
    } catch (restoreErr) {
      console.error('Failed to restore snapshot:', restoreErr.message);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
