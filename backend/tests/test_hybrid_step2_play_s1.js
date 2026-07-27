const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../src/shared/database/pool');
const matchesService = require('../src/modules/matches/service/matches.service');
const bracketRepository = require('../src/modules/tournament/repository/bracket.repository');

const TOUR_ID = process.env.TEST_TOUR_ID;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log(`\n--- [STEP 2] Verifying tournament ${TOUR_ID}...`);
  const { rows } = await pool.query(
    `SELECT tour_format FROM tournament WHERE tour_id = $1`,
    [TOUR_ID]
  );
  if (!rows[0] || rows[0].tour_format !== 'hybrid') {
    console.error('Error: Tournament must be hybrid.');
    process.exit(1);
  }

  console.log('--- [STEP 2] Simulating and completing all Stage 1 matches...');
  let stage1Finished = false;
  let loopCount = 1;

  while (!stage1Finished) {
    const matches = await bracketRepository.getMatchesByTournament(TOUR_ID);
    const s1ReadyMatches = matches.filter(
      m => m.stage === 'stage_1' && (m.status === 'ready' || m.status === 'running')
    );

    if (s1ReadyMatches.length === 0) {
      const activeS1Matches = matches.filter(m => m.stage === 'stage_1');
      const incompleteS1 = activeS1Matches.filter(m => !['completed', 'resolved', 'bye'].includes(m.status));
      
      if (incompleteS1.length === 0) {
        console.log('All Stage 1 matches are completed.');
        stage1Finished = true;
      } else {
        console.error('Error: Stage 1 is stuck. Incomplete matches:', incompleteS1);
        process.exit(1);
      }
      break;
    }

    console.log(`[Loop ${loopCount}] Playing ${s1ReadyMatches.length} matches...`);
    for (const match of s1ReadyMatches) {
      const comp1Name = match.c1_name || 'TBD';
      const comp2Name = match.c2_name || 'TBD';
      const winnerId = match.competitor1_id;

      console.log(`  -> Match [${match.match_id}] (${match.group_name} R${match.round}): ${comp1Name} vs ${comp2Name}`);
      await matchesService.updateMatch(match.match_id, {
        score1: 3,
        score2: 1,
        winning_competitor_id: winnerId,
        is_draw: false
      });
      await sleep(150);
    }
    loopCount++;
  }

  // Verify Stage 2 generated
  const matchesAfterS1 = await bracketRepository.getMatchesByTournament(TOUR_ID);
  const stage2Matches = matchesAfterS1.filter(m => m.stage === 'stage_2');
  console.log(`\nVerification: Found ${stage2Matches.length} matches generated for Stage 2 (Knockout).`);
  console.log('Stage 1 simulation complete. Run STEP 3 to complete the tournament.');
}

run().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Error during Step 2:', err);
  process.exit(1);
});
