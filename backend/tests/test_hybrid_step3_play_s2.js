const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../src/shared/database/pool');
const matchesService = require('../src/modules/matches/service/matches.service');
const bracketRepository = require('../src/modules/tournament/repository/bracket.repository');

const TOUR_ID = process.env.TEST_TOUR_ID_HYBRID;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log(`\n--- [STEP 3] Verifying tournament ${TOUR_ID}...`);
  const { rows } = await pool.query(
    `SELECT tour_format FROM tournament WHERE tour_id = $1`,
    [TOUR_ID]
  );
  if (!rows[0] || rows[0].tour_format !== 'hybrid') {
    console.error('Error: Tournament must be hybrid.');
    process.exit(1);
  }

  console.log('--- [STEP 3] Simulating Stage 2 matches (Knockout Bracket)...');
  let stage2Finished = false;
  let loopCount = 1;

  while (!stage2Finished) {
    const matches = await bracketRepository.getMatchesByTournament(TOUR_ID);
    const s2ReadyMatches = matches.filter(
      m => m.stage === 'stage_2' && (m.status === 'ready' || m.status === 'running')
    );

    if (s2ReadyMatches.length === 0) {
      const activeS2Matches = matches.filter(m => m.stage === 'stage_2');
      const incompleteS2 = activeS2Matches.filter(m => !['completed', 'resolved', 'bye'].includes(m.status));
      
      if (incompleteS2.length === 0) {
        console.log('All Stage 2 matches are completed.');
        stage2Finished = true;
      } else {
        console.log('Knockout stage bracket simulation finished or waiting for other matches.');
        stage2Finished = true;
      }
      break;
    }

    console.log(`[Loop ${loopCount}] Playing ${s2ReadyMatches.length} matches...`);
    for (const match of s2ReadyMatches) {
      const comp1Name = match.c1_name || 'TBD';
      const comp2Name = match.c2_name || 'TBD';
      const winnerId = match.competitor1_id;

      console.log(`  -> Match [${match.match_id}] (${match.group_name} R${match.round}): ${comp1Name} vs ${comp2Name}`);
      await matchesService.updateMatch(match.match_id, {
        score1: 2,
        score2: 1,
        winning_competitor_id: winnerId,
        is_draw: false
      });
      await sleep(150);
    }
    loopCount++;
  }

  console.log('\n=================== FINAL STANDINGS SUMMARY ===================');
  const finalMatches = await bracketRepository.getMatchesByTournament(TOUR_ID);
  for (const m of finalMatches) {
    const winnerName = m.winning_competitor_id === m.competitor1_id ? m.c1_name : (m.winning_competitor_id === m.competitor2_id ? m.c2_name : 'None');
    console.log(`- Match [${m.match_id}] | Stage: ${m.stage} | ${m.group_name} R${m.round} | Status: ${m.status} | ${m.c1_name || 'TBD'} (${m.score1 || 0}) vs ${m.c2_name || 'TBD'} (${m.score2 || 0}) | Winner: ${winnerName}`);
  }
}

run().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Error during Step 3:', err);
  process.exit(1);
});
