const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../src/shared/database/pool');
const bracketService = require('../src/modules/tournament/service/bracket.service');
const bracketRepository = require('../src/modules/tournament/repository/bracket.repository');

const TOUR_ID = process.env.TEST_TOUR_ID;

async function run() {
  console.log(`\n--- [STEP 1] Checking tournament ${TOUR_ID} format...`);
  const { rows } = await pool.query(
    `SELECT tour_format FROM tournament WHERE tour_id = $1`,
    [TOUR_ID]
  );
  const t = rows[0];
  if (!t) {
    console.error(`Error: Tournament ${TOUR_ID} not found.`);
    process.exit(1);
  }
  if (t.tour_format !== 'hybrid') {
    console.error(`Error: Tournament format must be 'hybrid' but found '${t.tour_format}'.`);
    process.exit(1);
  }

  console.log('--- [STEP 1] Generating Stage 1 matches...');
  await bracketService.generateBracket(TOUR_ID);
  
  const matches = await bracketRepository.getMatchesByTournament(TOUR_ID);
  const stage1Matches = matches.filter(m => m.stage === 'stage_1');
  console.log(`Successfully generated ${stage1Matches.length} matches for Stage 1 (Group Stage).`);
  console.log('You can now inspect the database or the frontend. Run STEP 2 to play Group Stage.');
}

run().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Error during Step 1:', err);
  process.exit(1);
});
