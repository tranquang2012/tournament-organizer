const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../src/shared/database/pool');
const bracketService = require('../src/modules/tournament/service/bracket.service');
const bracketRepository = require('../src/modules/tournament/repository/bracket.repository');

const TOUR_ID = process.env.TEST_TOUR_ID_ROUND_SCORING;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log(`--- 1. Checking tournament ${TOUR_ID} format...`);
  const { rows: tourRows } = await pool.query(
    `SELECT tour_format, created_by, advance_per_group FROM tournament WHERE tour_id = $1`,
    [TOUR_ID]
  );
  const t = tourRows[0];
  if (!t) {
    console.error(`Error: Tournament ${TOUR_ID} not found.`);
    process.exit(1);
  }
  if (t.tour_format !== 'round_scoring') {
    console.error(`Error: Tournament format must be 'round_scoring' but found '${t.tour_format}'.`);
    process.exit(1);
  }

  const organizerId = t.created_by;
  console.log(`Tournament verified. Creator ID: ${organizerId}`);

  console.log('--- 2. Generating a fresh Round Scoring stage...');
  const generationResult = await bracketService.generateBracket(TOUR_ID);
  console.log('Round scoring matches generated successfully.\n');

  // Fetch created rounds
  const rounds = await bracketRepository.getRoundScoringMatches(TOUR_ID);
  if (rounds.length === 0) {
    console.error('Error: No round scoring matches found after generation.');
    process.exit(1);
  }

  console.log(`=================== SIMULATING ROUND SCORING MATCHES ===================`);
  console.log(`Found ${rounds.length} round(s) to simulate.`);

  const competitors = await bracketRepository.getCompetitorsForSeeding(TOUR_ID);
  if (competitors.length < 2) {
    console.error('Error: Need at least 2 competitors to simulate scoring.');
    process.exit(1);
  }

  for (const match of rounds) {
    console.log(`\nSimulating Round ${match.round} [Match ID: ${match.match_id}]`);
    console.log(`Current status: ${match.status}`);

    if (match.status === 'completed') {
      console.log('Round is already completed. Skipping...');
      continue;
    }

    // Prepare test scores for all competitors (descending scores)
    const simulatedScores = competitors.map((c, index) => ({
      comp_id: c.comp_id,
      score: (competitors.length - index) * 10
    }));

    console.log(`Submitting scores for ${simulatedScores.length} competitors...`);
    const result = await bracketService.submitRoundScores(
      TOUR_ID,
      match.match_id,
      simulatedScores,
      organizerId
    );

    console.log(`Round ${match.round} completed successfully!`);
    console.log(`Survivors count: ${result.survivors.length}`);
    await sleep(200);
  }

  // Print final standings
  console.log('\n=================== STANDINGS SUMMARY ===================');
  const finalStandings = await bracketService.getRoundScoringStandings(TOUR_ID);
  console.log(`Completed Rounds: ${finalStandings.completed_rounds}/${finalStandings.total_rounds}`);
  console.log('Leaderboard:');
  for (const row of finalStandings.standings) {
    console.log(`- Rank ${row.rank} | ${row.comp_name} | Score: ${row.score} | Status: ${row.status}`);
  }
}

run().then(() => {
  console.log('\nRound scoring simulation successfully completed!');
  process.exit(0);
}).catch(err => {
  console.error('Error during round scoring simulation:', err);
  process.exit(1);
});
