import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateMatchLabels,
  mapMatchNode,
  transformBackendMatchesToBracket,
  mapMatchForCard,
} from '../src/utils/bracketLogic.js';

describe('bracketLogic', () => {
  const sampleMatches = [
    { match_id: 1, round: 1, group_name: 'Group A', status: 'completed', competitor1_id: 'c1', competitor2_id: 'c2' },
    { match_id: 2, round: 1, group_name: 'Group A', status: 'running', competitor1_id: 'c3', competitor2_id: 'c4' },
    { match_id: 3, round: 2, group_name: 'Group A', status: 'ready' },
  ];

  it('generates sequential match labels for single elimination in bracket style', () => {
    const labels = generateMatchLabels(sampleMatches, 'single_elimination', { style: 'bracket' });
    assert.equal(labels[1], 'Match 1');
    assert.equal(labels[2], 'Match 2');
    assert.equal(labels[3], 'Match 3');
  });

  it('generates sequential match labels for single elimination in card style', () => {
    const labels = generateMatchLabels(sampleMatches, 'single_elimination', { style: 'card' });
    assert.equal(labels[1], '1');
    assert.equal(labels[2], '2');
    assert.equal(labels[3], '3');
  });

  it('labels Grand Final and Lower Bracket in double elimination', () => {
    const deMatches = [
      { match_id: 10, round: 1, group_name: 'Upper Bracket' },
      { match_id: 11, round: 1, group_name: 'Lower Bracket' },
      { match_id: 12, round: 2, group_name: 'Grand Final' },
    ];
    const bracketLabels = generateMatchLabels(deMatches, 'double_elimination', { style: 'bracket' });
    assert.equal(bracketLabels[10], 'WB Match 1');
    assert.equal(bracketLabels[11], 'LB Match 1');
    assert.equal(bracketLabels[12], 'Grand Final');

    const cardLabels = generateMatchLabels(deMatches, 'double_elimination', { style: 'card' });
    assert.equal(cardLabels[10], 'WB 1');
    assert.equal(cardLabels[11], 'LB 1');
    assert.equal(cardLabels[12], 'GRAND FINAL');
  });

  it('labels Consolation Final in single elimination', () => {
    const seMatches = [
      { match_id: 20, round: 1, group_name: 'Quarterfinal' },
      { match_id: 21, round: 2, group_name: 'Consolation Final' },
    ];
    const labels = generateMatchLabels(seMatches, 'single_elimination', { style: 'card' });
    assert.equal(labels[20], '1');
    assert.equal(labels[21], 'CONSOLATION FINAL');
  });

  it('transforms backend matches to double elimination upper and lower brackets', () => {
    const backendMatches = [
      { match_id: 1, round: 1, stage: 'wb', group_name: 'WB Round 1', status: 'completed' },
      { match_id: 2, round: 1, stage: 'lb', group_name: 'LB Round 1', status: 'ready' },
    ];
    const result = transformBackendMatchesToBracket(backendMatches, 'double_elimination', false);
    assert.ok(result.upper);
    assert.ok(result.lower);
    assert.equal(result.upper.length, 1);
    assert.equal(result.lower.length, 1);
    assert.equal(result.upper[0].state, 'DONE');
    assert.equal(result.lower[0].state, 'SCHEDULED');
  });

  it('labels double elimination rounds from the tournament format, not the match', () => {
    const backendMatches = [
      { match_id: 1, round: 2, stage: 'wb', group_name: 'Upper Bracket' },
      { match_id: 2, round: 3, stage: 'lb', group_name: 'Lower Bracket' },
      { match_id: 3, round: 4, group_name: 'Grand Final' },
    ];
    const { upper, lower } = transformBackendMatchesToBracket(backendMatches, 'double_elimination', false);

    assert.equal(upper.find((m) => m.id === '1').tournamentRoundText, 'WB Round 2');
    assert.equal(lower.find((m) => m.id === '2').tournamentRoundText, 'LB Round 3');
    assert.equal(upper.find((m) => m.id === '3').tournamentRoundText, 'Grand Final');
  });

  it('uses the plain round number for non-elimination formats', () => {
    const nodes = transformBackendMatchesToBracket(
      [{ match_id: 1, round: 3, group_name: 'Group A' }],
      'round_robin',
      false
    );
    assert.equal(nodes[0].tournamentRoundText, '3');
  });

  it('maps match for card format correctly', () => {
    const match = {
      match_id: 99,
      status: 'completed',
      competitor1_id: 'teamA',
      competitor2_id: 'teamB',
      competitors: [
        { comp_id: 'teamA', comp_name: 'Alpha' },
        { comp_id: 'teamB', comp_name: 'Beta' },
      ],
      results: [
        { comp_id: 'teamA', score: 3 },
        { comp_id: 'teamB', score: 1 },
      ],
    };
    const card = mapMatchForCard(match, { 99: 'Match 99' }, false);
    assert.equal(card.id, 99);
    assert.equal(card.matchNumber, 'Match 99');
    assert.equal(card.status, 'Completed');
    assert.equal(card.team1.name, 'Alpha');
    assert.equal(card.team1.score, 3);
    assert.equal(card.team2.name, 'Beta');
    assert.equal(card.team2.score, 1);
  });

  it('maps match to bracket node format with mapMatchNode', () => {
    const match = {
      match_id: 10,
      status: 'completed',
      competitor1_id: 'c1',
      competitor2_id: 'c2',
      winning_competitor_id: 'c1',
      competitors: [
        { comp_id: 'c1', comp_name: 'Team 1' },
        { comp_id: 'c2', comp_name: 'Team 2' },
      ],
      results: [
        { comp_id: 'c1', score: 2 },
        { comp_id: 'c2', score: 0 },
      ],
    };
    const node = mapMatchNode(match, { 10: 'Match 10' }, false);
    assert.equal(node.id, '10');
    assert.equal(node.name, 'Match 10');
    assert.equal(node.state, 'DONE');
    assert.equal(node.participants.length, 2);
    assert.equal(node.participants[0].isWinner, true);
    assert.equal(node.participants[0].resultText, '2');
    assert.equal(node.participants[1].isWinner, false);
    assert.equal(node.participants[1].resultText, '0');
  });
});
