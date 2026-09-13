const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isMatchPlayed,
  nextTourStatusFromMatches,
} = require('../src/modules/tournament/tournamentCompletion');

test('isMatchPlayed is true for winner, draw, or finished statuses', () => {
  assert.equal(isMatchPlayed({ winning_competitor_id: 'a' }), true);
  assert.equal(isMatchPlayed({ is_draw: true, status: 'running' }), true);
  assert.equal(isMatchPlayed({ status: 'completed' }), true);
  assert.equal(isMatchPlayed({ status: 'resolved' }), true);
  assert.equal(isMatchPlayed({ status: 'archived' }), true);
  assert.equal(isMatchPlayed({ status: 'bye' }), true);
});

test('isMatchPlayed is false for unfinished statuses without a result', () => {
  assert.equal(isMatchPlayed({ status: 'locked' }), false);
  assert.equal(isMatchPlayed({ status: 'ready' }), false);
  assert.equal(isMatchPlayed({ status: 'running' }), false);
  assert.equal(isMatchPlayed({ status: 'paused' }), false);
  assert.equal(isMatchPlayed({ is_draw: false, winning_competitor_id: null }), false);
});

test('all matches played marks ongoing and paused as completed', () => {
  const matches = [
    { winning_competitor_id: 'a', status: 'completed' },
    { is_draw: true, status: 'completed' },
    { status: 'bye' },
  ];
  assert.equal(nextTourStatusFromMatches('ongoing', matches), 'ended');
  assert.equal(nextTourStatusFromMatches('paused', matches), 'ended');
});

test('zero matches does not mark completed', () => {
  assert.equal(nextTourStatusFromMatches('ongoing', []), 'ongoing');
  assert.equal(nextTourStatusFromMatches('paused', []), 'paused');
  assert.equal(nextTourStatusFromMatches('ended', []), 'ongoing');
  assert.equal(nextTourStatusFromMatches('completed', []), 'ongoing');
});

test('unplayed match keeps ongoing/paused and reverts completed to ongoing', () => {
  const matches = [
    { status: 'completed', winning_competitor_id: 'a' },
    { status: 'ready' },
  ];
  assert.equal(nextTourStatusFromMatches('ongoing', matches), 'ongoing');
  assert.equal(nextTourStatusFromMatches('paused', matches), 'paused');
  assert.equal(nextTourStatusFromMatches('ended', matches), 'ongoing');
  assert.equal(nextTourStatusFromMatches('completed', matches), 'ongoing');
});

test('draft is never completed from match results', () => {
  const matches = [{ status: 'completed', winning_competitor_id: 'a' }];
  assert.equal(nextTourStatusFromMatches('draft', matches), 'draft');
  assert.equal(nextTourStatusFromMatches(null, matches), 'draft');
});

test('hybrid stays ongoing until stage 2 exists, even if stage 1 is fully played', () => {
  const stage1Done = [
    { stage: 'stage_1', status: 'completed', winning_competitor_id: 'a' },
    { stage: 'stage_1', status: 'completed', winning_competitor_id: 'b' },
  ];
  assert.equal(nextTourStatusFromMatches('ongoing', stage1Done, { format: 'hybrid' }), 'ongoing');
  assert.equal(nextTourStatusFromMatches('paused', stage1Done, { format: 'hybrid' }), 'paused');
  assert.equal(nextTourStatusFromMatches('ended', stage1Done, { format: 'hybrid' }), 'ongoing');
  assert.equal(nextTourStatusFromMatches('completed', stage1Done, { format: 'hybrid' }), 'ongoing');
});

test('hybrid completes only after stage 2 matches are also played', () => {
  const withUnplayedFinal = [
    { stage: 'stage_1', status: 'completed', winning_competitor_id: 'a' },
    { stage: 'stage_2', status: 'ready' },
  ];
  const allDone = [
    { stage: 'stage_1', status: 'completed', winning_competitor_id: 'a' },
    { stage: 'stage_2', status: 'completed', winning_competitor_id: 'b' },
  ];
  assert.equal(nextTourStatusFromMatches('ongoing', withUnplayedFinal, { format: 'hybrid' }), 'ongoing');
  assert.equal(nextTourStatusFromMatches('ongoing', allDone, { format: 'hybrid' }), 'ended');
});
