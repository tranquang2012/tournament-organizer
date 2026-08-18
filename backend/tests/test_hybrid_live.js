const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../src/shared/database/pool');
const matchesService = require('../src/modules/matches/service/matches.service');
const bracketService = require('../src/modules/tournament/service/bracket.service');
const bracketRepository = require('../src/modules/tournament/repository/bracket.repository');

const TOUR_ID = process.env.TEST_TOUR_ID_HYBRID;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  // ==========================================
  // STEP 1: Verify Tournament Format
  // ==========================================
  console.log(`\n--- STEP 1: Checking tournament ${TOUR_ID} format...`);
  const { rows } = await pool.query(
    `SELECT tour_format, first_stage_format, second_stage_format FROM tournament WHERE tour_id = $1`,
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
  console.log(`Tournament verified as Hybrid. Stage 1: ${t.first_stage_format} | Stage 2: ${t.second_stage_format}`);

  // ==========================================
  // STEP 2: Generate Stage 1 Matches
  // ==========================================
  console.log('\n--- STEP 2: Generating matches for Stage 1 (Group/Scoring)...');
  await bracketService.generateBracket(TOUR_ID);
  console.log('Stage 1 matches generated successfully.');

  // ==========================================
  // STEP 3: Play Stage 1 (Group Stage) Matches
  // ==========================================
  console.log('\n--- STEP 3: Simulating match results for Stage 1...');
  let stage1Finished = false;
  let s1LoopCount = 1;

  while (!stage1Finished) {
    const matches = await bracketRepository.getMatchesByTournament(TOUR_ID);
    
    // Filter matches that are in stage_1 and are ready or running
    const s1ReadyMatches = matches.filter(
      m => m.stage === 'stage_1' && (m.status === 'ready' || m.status === 'running')
    );

    if (s1ReadyMatches.length === 0) {
      // Check if all stage 1 matches are indeed completed
      const activeS1Matches = matches.filter(m => m.stage === 'stage_1');
      const incompleteS1 = activeS1Matches.filter(m => !['completed', 'resolved', 'bye'].includes(m.status));
      
      if (incompleteS1.length === 0) {
        console.log('All Stage 1 matches have been played to completion.');
        stage1Finished = true;
      } else {
        console.error('Error: Stage 1 is stuck. Some matches are incomplete but not ready.', incompleteS1);
        process.exit(1);
      }
      break;
    }

    console.log(`\n[Stage 1 Loop ${s1LoopCount}] Simulating ${s1ReadyMatches.length} matches:`);
    for (const match of s1ReadyMatches) {
      const comp1Name = match.c1_name || 'TBD';
      const comp2Name = match.c2_name || 'TBD';
      const winnerId = match.competitor1_id; // Simulating competitor 1 win

      console.log(`  -> Playing Match [${match.match_id}] (${match.group_name} R${match.round}): ${comp1Name} vs ${comp2Name}`);
      await matchesService.updateMatch(match.match_id, {
        score1: 3,
        score2: 1,
        winning_competitor_id: winnerId,
        is_draw: false
      });
      await sleep(150);
    }
    s1LoopCount++;
  }

  // ==========================================
  // STEP 4: Verify Advancement to Stage 2
  // ==========================================
  console.log('\n--- STEP 4: Verifying advancement and transition to Stage 2 (Knockout)...');
  
  // Fetch current state to check if stage 2 has been generated automatically
  const matchesAfterS1 = await bracketRepository.getMatchesByTournament(TOUR_ID);
  const stage2Matches = matchesAfterS1.filter(m => m.stage === 'stage_2');

  if (stage2Matches.length === 0) {
    console.error('Error: Stage 2 matches were not generated after completing Stage 1.');
    process.exit(1);
  }
  
  console.log(`Stage 2 has been generated successfully with ${stage2Matches.length} matches.`);

  // ==========================================
  // STEP 5: Play Stage 2 (Knockout Stage) Matches
  // ==========================================
  console.log('\n--- STEP 5: Simulating match results for Stage 2...');
  let stage2Finished = false;
  let s2LoopCount = 1;

  while (!stage2Finished) {
    const matches = await bracketRepository.getMatchesByTournament(TOUR_ID);
    
    // Filter matches that are in stage_2 and are ready or running
    const s2ReadyMatches = matches.filter(
      m => m.stage === 'stage_2' && (m.status === 'ready' || m.status === 'running')
    );

    if (s2ReadyMatches.length === 0) {
      // Check if all stage 2 matches are completed
      const activeS2Matches = matches.filter(m => m.stage === 'stage_2');
      const incompleteS2 = activeS2Matches.filter(m => !['completed', 'resolved', 'bye'].includes(m.status));
      
      if (incompleteS2.length === 0) {
        console.log('All Stage 2 matches have been played to completion.');
        stage2Finished = true;
      } else {
        console.log('Knockout stage brackets are waiting for other matches or completed.');
        stage2Finished = true;
      }
      break;
    }

    console.log(`\n[Stage 2 Loop ${s2LoopCount}] Simulating ${s2ReadyMatches.length} matches:`);
    for (const match of s2ReadyMatches) {
      const comp1Name = match.c1_name || 'TBD';
      const comp2Name = match.c2_name || 'TBD';
      const winnerId = match.competitor1_id; // Simulating competitor 1 win

      console.log(`  -> Playing Match [${match.match_id}] (${match.group_name} R${match.round}): ${comp1Name} vs ${comp2Name}`);
      await matchesService.updateMatch(match.match_id, {
        score1: 2,
        score2: 1,
        winning_competitor_id: winnerId,
        is_draw: false
      });
      await sleep(150);
    }
    s2LoopCount++;
  }

  // ==========================================
  // FINAL RESULTS SUMMARY
  // ==========================================
  console.log('\n=================== SIMULATION COMPLETED ===================');
  const finalMatches = await bracketRepository.getMatchesByTournament(TOUR_ID);
  
  console.log('Final Tournament Matches State on Supabase:');
  for (const m of finalMatches) {
    const winnerName = m.winning_competitor_id === m.competitor1_id ? m.c1_name : (m.winning_competitor_id === m.competitor2_id ? m.c2_name : 'None');
    console.log(`- Match [${m.match_id}] | Stage: ${m.stage} | ${m.group_name} R${m.round} | Status: ${m.status} | ${m.c1_name || 'TBD'} (${m.score1 || 0}) vs ${m.c2_name || 'TBD'} (${m.score2 || 0}) | Winner: ${winnerName}`);
  }
}

run().then(() => {
  console.log('\nHybrid tournament live progression simulation successfully completed!');
  process.exit(0);
}).catch(err => {
  console.error('Error during tournament simulation:', err);
  process.exit(1);
});
