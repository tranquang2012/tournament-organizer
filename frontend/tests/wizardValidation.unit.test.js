import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateWizardStep,
  isWizardStepCompleted,
  isValidLobbyCount,
  getParticipantCount,
} from '../src/utils/wizardValidation.js';

const players = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));

describe('wizardValidation', () => {
  it('validates lobby count only when the sport uses lobbies', () => {
    assert.equal(isValidLobbyCount(8, 8), true);
    assert.equal(isValidLobbyCount(16, 8), true);
    assert.equal(isValidLobbyCount(64, 8), true);
    assert.equal(isValidLobbyCount(10, 8), false);
    assert.equal(isValidLobbyCount(10, null), true);
  });

  it('counts teams for pre-defined mode and the player pool otherwise', () => {
    assert.equal(
      getParticipantCount({ participantType: 'team', teamMode: 'predefine', teams: [{}, {}] }),
      2
    );
    assert.equal(
      getParticipantCount({ participantType: 'team', teamMode: 'randomize', participants: players(10) }),
      10
    );
    assert.equal(getParticipantCount({ participantType: 'individual', participants: players(3) }), 3);
  });

  it('rejects empty tournament name in step 0', () => {
    const result = validateWizardStep({ name: '', startDate: '2026-01-01', endDate: '2026-01-02' }, 0);
    assert.equal(result.isValid, false);
    assert.match(result.error, /Tournament name is required/i);
  });

  it('rejects end date before start date in step 0', () => {
    const result = validateWizardStep(
      { name: 'Championship', startDate: '2026-05-10', endDate: '2026-05-01' },
      0
    );
    assert.equal(result.isValid, false);
    assert.match(result.error, /End date must be on or after start date/i);
  });

  it('accepts valid step 0 input', () => {
    const result = validateWizardStep(
      { name: 'Summer Cup', startDate: '2026-06-01', endDate: '2026-06-05' },
      0
    );
    assert.equal(result.isValid, true);
    assert.equal(result.error, null);
  });

  it('requires every pre-defined team to have members in step 1', () => {
    const formData = {
      sport: 'Football',
      participantType: 'team',
      teamMode: 'predefine',
      teams: [{ name: 'A', members: [{ name: 'P1' }] }, { name: 'B', members: [] }],
    };
    const result = validateWizardStep(formData, 1);
    assert.equal(result.isValid, false);
    assert.match(result.error, /Every team needs at least one member/i);
  });

  it('derives numberOfTeams for randomize team mode in step 1', () => {
    const formData = {
      sport: 'Football',
      participantType: 'team',
      teamMode: 'randomize',
      membersPerTeam: '5',
      participants: players(10),
    };
    const result = validateWizardStep(formData, 1);
    assert.equal(result.isValid, true);
    assert.deepEqual(result.updates, { numberOfTeams: 2 });
  });

  it('rejects uneven division in randomize team mode in step 1', () => {
    const formData = {
      sport: 'Football',
      participantType: 'team',
      teamMode: 'randomize',
      membersPerTeam: '4',
      participants: players(3),
    };
    const result = validateWizardStep(formData, 1);
    assert.equal(result.isValid, false);
    assert.match(result.error, /cannot be divided equally/i);
  });

  it('enforces lobby sizes against the player pool in step 1', () => {
    const formData = {
      sport: 'Badminton',
      participantType: 'individual',
      participants: players(10),
    };
    const result = validateWizardStep(formData, 1, { lobbySize: 8 });
    assert.equal(result.isValid, false);
    assert.match(result.error, /requires 8, 16, 32, or 64 players/i);

    const ok = validateWizardStep({ ...formData, participants: players(16) }, 1, { lobbySize: 8 });
    assert.equal(ok.isValid, true);
  });

  it('validates hybrid format requirements in step 2', () => {
    const result = validateWizardStep(
      { format: 'hybrid', hybridGroups: '', hybridAdvancing: '' },
      2
    );
    assert.equal(result.isValid, false);
    assert.match(result.error, /configure the first round groups/i);
  });

  it('infers the hybrid second round for scoring sports in step 2', () => {
    const formData = { format: 'hybrid', hybridGroups: '2', hybridAdvancing: '4', setsPerMatch: '3' };

    assert.equal(validateWizardStep(formData, 2, { isScoringSport: false }).isValid, false);
    assert.equal(validateWizardStep(formData, 2, { isScoringSport: true }).isValid, true);
  });

  it('bounds games per match for scoring formats in step 2', () => {
    const base = { format: 'round_scoring' };
    assert.equal(validateWizardStep({ ...base, setsPerMatch: '3' }, 2).isValid, true);

    const tooMany = validateWizardStep({ ...base, setsPerMatch: '21' }, 2);
    assert.equal(tooMany.isValid, false);
    assert.match(tooMany.error, /between 1 and 20/i);
  });

  it('marks steps complete with the stepper rules', () => {
    const formData = {
      name: 'Summer Cup',
      startDate: '2026-06-01',
      endDate: '2026-06-05',
      sport: 'Football',
      participantType: 'team',
      teamMode: 'randomize',
      membersPerTeam: '5',
      participants: players(10),
      format: 'round_robin',
    };

    assert.equal(isWizardStepCompleted(formData, 0), true);
    assert.equal(isWizardStepCompleted(formData, 1), true);
    assert.equal(isWizardStepCompleted(formData, 2), true);
    assert.equal(isWizardStepCompleted(formData, 3), false);

    assert.equal(isWizardStepCompleted({ ...formData, membersPerTeam: '0' }, 1), false);
    assert.equal(isWizardStepCompleted(formData, 1, { lobbySize: 8 }), false);
  });
});
