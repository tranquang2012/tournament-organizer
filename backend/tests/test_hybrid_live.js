const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../src/shared/database/pool');
const matchesService = require('../src/modules/matches/service/matches.service');
const bracketService = require('../src/modules/tournament/service/bracket.service');
const bracketRepository = require('../src/modules/tournament/repository/bracket.repository');

const TOUR_ID = process.env.TEST_TOUR_ID_HYBRID || '66475da2-1ed6-4550-9d26-89e24b49165a';

const GROUP_OUTCOMES = [
  { score1: 3, score2: 1, winner: 'c1', draw: false },
  { score1: 0, score2: 2, winner: 'c2', draw: false },
  { score1: 2, score2: 2, winner: null, draw: true },
  { score1: 4, score2: 1, winner: 'c1', draw: false },
  { score1: 1, score2: 3, winner: 'c2', draw: false },
  { score1: 0, score2: 0, winner: null, draw: true },
  { score1: 5, score2: 4, winner: 'c1', draw: false },
  { score1: 2, score2: 0, winner: 'c1', draw: false },
  { score1: 1, score2: 4, winner: 'c2', draw: false },
  { score1: 3, score2: 3, winner: null, draw: true },
];

const KNOCKOUT_OUTCOMES = [
  { score1: 2, score2: 1, winner: 'c1' },
  { score1: 0, score2: 3, winner: 'c2' },
  { score1: 4, score2: 3, winner: 'c1' },
  { score1: 1, score2: 2, winner: 'c2' },
  { score1: 3, score2: 0, winner: 'c1' },
  { score1: 2, score2: 5, winner: 'c2' },
  { score1: 1, score2: 0, winner: 'c1' },
  { score1: 4, score2: 6, winner: 'c2' },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function describeOutcome(match, result) {
  const c1 = match.c1_name || 'TBD';
  const c2 = match.c2_name || 'TBD';
  if (result.draw) return `${c1} ${result.score1}-${result.score2} ${c2} (draw)`;
  const winnerName = result.winner === 'c1' ? c1 : c2;
  return `${c1} ${result.score1}-${result.score2} ${c2} (winner: ${winnerName})`;
}

async function playVersusMatch(match, index, allowDraws) {
  if (!match.competitor1_id || !match.competitor2_id) {
    console.log(`  -> Skipping Match [${match.match_id}] — missing competitor (TBD/bye).`);
    return;
  }

  const table = allowDraws ? GROUP_OUTCOMES : KNOCKOUT_OUTCOMES;
  const result = table[index % table.length];
  const winning_competitor_id = result.draw
    ? null
    : (result.winner === 'c1' ? match.competitor1_id : match.competitor2_id);

  console.log(`  -> Playing Match [${match.match_id}] (${match.group_name} R${match.round}): ${describeOutcome(match, result)}`);
  await matchesService.updateMatch(match.match_id, {
    score1: result.score1,
    score2: result.score2,
    winning_competitor_id,
    is_draw: Boolean(result.draw),
  });
}

async function playRoundScoringMatch(tourId, match, organizerId) {
  const competitors = await bracketRepository.getCompetitorsForSeeding(tourId);
  const scores = competitors.map((c, index) => ({
    comp_id: c.comp_id,
    score: 40 + ((index * 17 + Number(match.round || 1) * 11) % 61) + (index % 3) * 5,
  }));

  console.log(`  -> Submitting diverse round scores for [${match.match_id}] Round ${match.round}`);
  await bracketService.submitRoundScores(tourId, match.match_id, scores, organizerId);
}

async function run() {
  // ==========================================
  // STEP 1: Verify Tournament Format
  // ==========================================
  console.log(`\n--- STEP 1: Checking tournament ${TOUR_ID} format...`);
  const { rows } = await pool.query(
    `SELECT tour_format, first_stage_format, second_stage_format, created_by
     FROM tournament WHERE tour_id = $1`,
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
  let s1Played = 0;

  while (!stage1Finished) {
    const matches = await bracketRepository.getMatchesByTournament(TOUR_ID);
    const s1ReadyMatches = matches.filter(
      m => m.stage === 'stage_1' && (m.status === 'ready' || m.status === 'running')
    );

    if (s1ReadyMatches.length === 0) {
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
      if (t.first_stage_format === 'round_scoring' || (!match.competitor1_id && !match.competitor2_id)) {
        await playRoundScoringMatch(TOUR_ID, match, t.created_by);
      } else {
        await playVersusMatch(match, s1Played, true);
        s1Played += 1;
      }
      await sleep(150);
    }
    s1LoopCount++;
    if (s1LoopCount > 20) {
      console.error('Safety break: Stage 1 exceeded 20 loops.');
      process.exit(1);
    }
  }

  // ==========================================
  // STEP 4: Verify Advancement to Stage 2
  // ==========================================
  console.log('\n--- STEP 4: Verifying advancement and transition to Stage 2 (Knockout)...');
  
  // Fetch current state to check if stage 2 has been generated automatically
  const matchesAfterS1 = await bracketRepository.getMatchesByTournament(TOUR_ID);
  const stage2Matches = matchesAfterS1.filter(m => m.stage === 'stage_2');

  if (stage2Matches.length === 0) {
    console.log('Stage 2 not generated yet. Triggering advancement...');
    await bracketService.ensureHybridStageTwoGenerated(TOUR_ID);
  }

  const matchesAfterAdvance = await bracketRepository.getMatchesByTournament(TOUR_ID);
  const generatedStage2 = matchesAfterAdvance.filter(m => m.stage === 'stage_2');

  if (generatedStage2.length === 0) {
    console.error('Error: Stage 2 matches were not generated after completing Stage 1.');
    process.exit(1);
  }

  console.log(`Stage 2 has been generated successfully with ${generatedStage2.length} matches.`);

  // ==========================================
  // STEP 5: Play Stage 2 (Knockout Stage) Matches
  // ==========================================
  console.log('\n--- STEP 5: Simulating match results for Stage 2...');
  let stage2Finished = false;
  let s2LoopCount = 1;
  let s2Played = 0;

  while (!stage2Finished) {
    const matches = await bracketRepository.getMatchesByTournament(TOUR_ID);
    const s2ReadyMatches = matches.filter(
      m => m.stage === 'stage_2' && (m.status === 'ready' || m.status === 'running')
    );

    if (s2ReadyMatches.length === 0) {
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
    const playable = s2ReadyMatches.filter(m => (
      t.second_stage_format === 'round_scoring' || (m.competitor1_id && m.competitor2_id)
    ));
    if (playable.length === 0) {
      console.log('No playable Stage 2 matches yet (waiting on TBD slots).');
      stage2Finished = true;
      break;
    }

    for (const match of playable) {
      if (t.second_stage_format === 'round_scoring') {
        await playRoundScoringMatch(TOUR_ID, match, t.created_by);
      } else {
        await playVersusMatch(match, s2Played, false);
        s2Played += 1;
      }
      await sleep(150);
    }
    s2LoopCount++;
    if (s2LoopCount > 20) {
      console.error('Safety break: Stage 2 exceeded 20 loops.');
      process.exit(1);
    }
  }

  // ==========================================
  // FINAL RESULTS SUMMARY
  // ==========================================
  console.log('\n=================== SIMULATION COMPLETED ===================');
  const finalMatches = await bracketRepository.getMatchesByTournament(TOUR_ID);
  
  console.log('Final Tournament Matches State on Supabase:');
  for (const m of finalMatches) {
    const winnerName = m.is_draw
      ? 'Draw'
      : (m.winning_competitor_id === m.competitor1_id ? m.c1_name : (m.winning_competitor_id === m.competitor2_id ? m.c2_name : 'None'));
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
