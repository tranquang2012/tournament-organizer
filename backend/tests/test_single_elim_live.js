const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../src/shared/database/pool');
const matchesService = require('../src/modules/matches/service/matches.service');
const bracketService = require('../src/modules/tournament/service/bracket.service');
const bracketRepository = require('../src/modules/tournament/repository/bracket.repository');

const TOUR_ID = process.env.TEST_TOUR_ID_SINGLE_ELIM;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log(`--- 1. Checking tournament ${TOUR_ID} format...`);
  const { rows } = await pool.query(
    `SELECT tour_format FROM tournament WHERE tour_id = $1`,
    [TOUR_ID]
  );
  const t = rows[0];
  if (!t) {
    console.error(`Error: Tournament ${TOUR_ID} not found.`);
    process.exit(1);
  }
  if (t.tour_format !== 'single_elimination') {
    console.error(`Error: Tournament format must be 'single_elimination' but found '${t.tour_format}'.`);
    process.exit(1);
  }

  console.log('--- 2. Generating a fresh Single Elimination bracket (with Consolation Final)...');
  await bracketService.generateBracket(TOUR_ID);
  console.log('Bracket generated successfully. Beginning simulation...\n');

  let roundCount = 1;
  let matchesPlayedCount = 0;

  while (true) {
    // Fetch current state of all matches
    const matches = await bracketRepository.getMatchesByTournament(TOUR_ID);
    
    // Find matches that are ready or running to be played
    const readyMatches = matches.filter(m => m.status === 'ready' || m.status === 'running');

    if (readyMatches.length === 0) {
      console.log('No more "ready" or "running" matches found.');
      break;
    }

    console.log(`\n=================== SIMULATING ROUND ${roundCount} ===================`);
    console.log(`Found ${readyMatches.length} matches ready to be played:`);

    for (const match of readyMatches) {
      const comp1Name = match.c1_name || 'TBD';
      const comp2Name = match.c2_name || 'TBD';
      
      const winnerId = match.competitor1_id; // Set competitor 1 as the winner for simulation
      console.log(`Playing Match [${match.match_id}] (${match.group_name} R${match.round}): ${comp1Name} vs ${comp2Name}`);
      
      await matchesService.updateMatch(match.match_id, {
        score1: 2,
        score2: 1,
        winning_competitor_id: winnerId,
        is_draw: false
      });

      matchesPlayedCount++;
      await sleep(150); // Delay to ensure write & progression completes in order
    }

    roundCount++;
    if (roundCount > 10) {
      console.log('Safety break: Exceeded 10 round loops.');
      break;
    }
  }

  // Print final results
  console.log('\n=================== SIMULATION COMPLETED ===================');
  const finalMatches = await bracketRepository.getMatchesByTournament(TOUR_ID);
  
  console.log(`Played a total of ${matchesPlayedCount} matches.`);
  console.log('\nFinal Tournament Brackets State on Supabase:');
  
  for (const m of finalMatches) {
    const winnerName = m.winning_competitor_id === m.competitor1_id ? m.c1_name : (m.winning_competitor_id === m.competitor2_id ? m.c2_name : 'None');
    console.log(`- Match [${m.match_id}] | ${m.group_name} R${m.round} | Status: ${m.status} | ${m.c1_name || 'TBD'} (${m.score1 || 0}) vs ${m.c2_name || 'TBD'} (${m.score2 || 0}) | Winner: ${winnerName}`);
  }
}

run().then(() => {
  console.log('\nConsolation final live progression simulation successfully completed!');
  process.exit(0);
}).catch(err => {
  console.error('Error during tournament simulation:', err);
  process.exit(1);
});
