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
  assert.equal(nextTourStatusFromMatches('ongoing', matches), 'completed');
  assert.equal(nextTourStatusFromMatches('paused', matches), 'completed');
});

test('zero matches does not mark completed', () => {
  assert.equal(nextTourStatusFromMatches('ongoing', []), 'ongoing');
  assert.equal(nextTourStatusFromMatches('paused', []), 'paused');
  assert.equal(nextTourStatusFromMatches('completed', []), 'ongoing');
});

test('unplayed match keeps ongoing/paused and reverts completed to ongoing', () => {
  const matches = [
    { status: 'completed', winning_competitor_id: 'a' },
    { status: 'ready' },
  ];
  assert.equal(nextTourStatusFromMatches('ongoing', matches), 'ongoing');
  assert.equal(nextTourStatusFromMatches('paused', matches), 'paused');
  assert.equal(nextTourStatusFromMatches('completed', matches), 'ongoing');
});

test('draft is never completed from match results', () => {
  const matches = [{ status: 'completed', winning_competitor_id: 'a' }];
  assert.equal(nextTourStatusFromMatches('draft', matches), 'draft');
  assert.equal(nextTourStatusFromMatches(null, matches), 'draft');
});
