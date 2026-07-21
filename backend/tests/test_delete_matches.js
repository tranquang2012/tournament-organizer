require('dotenv').config();
const pool = require('../src/shared/database/pool');
const bracketRepository = require('../src/modules/tournament/repository/bracket.repository');

const TOUR_ID = process.env.TEST_TOUR_ID;

async function run() {
  console.log(`--- 1. Checking tournament ${TOUR_ID} existence...`);
  const { rows: tourRows } = await pool.query(
    `SELECT tour_name FROM tournament WHERE tour_id = $1`,
    [TOUR_ID]
  );
  const t = tourRows[0];
  if (!t) {
    console.error(`Error: Tournament ${TOUR_ID} not found.`);
    process.exit(1);
  }
  console.log(`Tournament verified: "${t.tour_name}"`);

  // Count current matches
  const { rows: countRowsBefore } = await pool.query(
    `SELECT COUNT(*)::int FROM matches WHERE tour_id = $1`,
    [TOUR_ID]
  );
  const matchesCountBefore = countRowsBefore[0].count;
  console.log(`Current matches count in tournament: ${matchesCountBefore}`);

  if (matchesCountBefore === 0) {
    console.log('No matches to delete. Test completed.');
    process.exit(0);
  }

  console.log('--- 2. Deleting all matches for the tournament...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await bracketRepository.deleteMatchesByTournament(TOUR_ID, client);
    await client.query('COMMIT');
    console.log('Deletion query completed.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Verify deletion
  const { rows: countRowsAfter } = await pool.query(
    `SELECT COUNT(*)::int FROM matches WHERE tour_id = $1`,
    [TOUR_ID]
  );
  const matchesCountAfter = countRowsAfter[0].count;
  console.log(`Matches count after deletion: ${matchesCountAfter}`);

  if (matchesCountAfter !== 0) {
    console.error(`Error: Matches were not deleted successfully. Count: ${matchesCountAfter}`);
    process.exit(1);
  }

  console.log('All matches successfully deleted from the database.');
}

run().then(() => {
  console.log('\nMatch deletion test successfully completed!');
  process.exit(0);
}).catch(err => {
  console.error('Error during match deletion test:', err);
  process.exit(1);
});
