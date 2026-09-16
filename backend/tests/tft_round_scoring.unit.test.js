const test = require('node:test');
const assert = require('node:assert/strict');
const { validateSportParticipantsDto } = require('../src/modules/tournament/dto/sportParticipants.dto');
const {
  validateFormatConfigDto,
  getLobbyPreset,
  LOBBY_TOURNAMENT_SIZES,
} = require('../src/modules/tournament/dto/formatConfig.dto');

const TFT_SP_ID = 11;
const RUNNING_SP_ID = 5;

const makeParticipants = (count) => Array.from({ length: count }, (_, i) => ({
  comp_name: `Player ${i + 1}`,
}));

test('sportParticipants allows TFT lobby counts 8/16/32/64', () => {
  for (const count of LOBBY_TOURNAMENT_SIZES) {
    const { errors } = validateSportParticipantsDto({
      sp_id: TFT_SP_ID,
      participant_type: 'individual',
      participants: makeParticipants(count),
    });
    assert.equal(errors, null, `expected ${count} players to be valid`);
  }
});

test('sportParticipants rejects invalid TFT lobby counts', () => {
  for (const count of [7, 9, 15, 24]) {
    const { errors } = validateSportParticipantsDto({
      sp_id: TFT_SP_ID,
      participant_type: 'individual',
      participants: makeParticipants(count),
    });
    assert.ok(errors?.length, `expected ${count} players to be rejected`);
  }
});

test('getLobbyPreset returns expected TFT presets', () => {
  assert.deepEqual(getLobbyPreset(16, 8), { group_count: 2, advance_per_group: 4 });
  assert.deepEqual(getLobbyPreset(32, 8), { group_count: 4, advance_per_group: 2 });
  assert.deepEqual(getLobbyPreset(64, 8), { group_count: 8, advance_per_group: 1 });
  assert.equal(getLobbyPreset(8, 8), null);
});

test('formatConfig forces TFT 8 players to round_scoring', () => {
  const { data, errors } = validateFormatConfigDto(
    { tour_format: 'round_scoring', setsPerMatch: 3 },
    TFT_SP_ID,
    8
  );
  assert.equal(errors, null);
  assert.equal(data.tour_format, 'round_scoring');
  assert.equal(data.sets_per_match, 3);
});

test('formatConfig rejects TFT 8 players with hybrid format', () => {
  const { errors } = validateFormatConfigDto(
    { tour_format: 'hybrid', hybridGroups: 1, hybridAdvancing: 4 },
    TFT_SP_ID,
    8
  );
  assert.ok(errors?.some((e) => e.includes('single round scoring')));
});

test('formatConfig forces TFT 16 players to hybrid scoring stages with presets', () => {
  const { data, errors } = validateFormatConfigDto(
    {
      tour_format: 'hybrid',
      hybridGroups: 9,
      hybridAdvancing: 9,
      second_stage_format: 'single_elimination',
      setsPerMatch: 6,
    },
    TFT_SP_ID,
    16
  );
  assert.equal(errors, null);
  assert.equal(data.tour_format, 'hybrid');
  assert.equal(data.group_count, 2);
  assert.equal(data.advance_per_group, 4);
  assert.equal(data.first_stage_format, 'round_scoring');
  assert.equal(data.second_stage_format, 'round_scoring');
  assert.equal(data.sets_per_match, 6);
});

test('formatConfig scoring sport hybrid defaults both stages to round_scoring', () => {
  const { data, errors } = validateFormatConfigDto(
    { tour_format: 'hybrid', hybridGroups: 2, hybridAdvancing: 2 },
    RUNNING_SP_ID,
    20
  );
  assert.equal(errors, null);
  assert.equal(data.first_stage_format, 'round_scoring');
  assert.equal(data.second_stage_format, 'round_scoring');
  assert.equal(data.sets_per_match, 1);
});

test('formatConfig locks running to one race per session', () => {
  const { data, errors } = validateFormatConfigDto(
    { tour_format: 'round_scoring', setsPerMatch: 2 },
    RUNNING_SP_ID,
    10
  );
  assert.ok(errors?.some((e) => e.includes('one race')));
  assert.equal(data, null);

  const accepted = validateFormatConfigDto(
    { tour_format: 'round_scoring', setsPerMatch: 1 },
    RUNNING_SP_ID,
    10
  );
  assert.equal(accepted.errors, null);
  assert.equal(accepted.data.sets_per_match, 1);
});

test('formatConfig versus sport hybrid still uses round robin stage one', () => {
  const { data, errors } = validateFormatConfigDto(
    { tour_format: 'hybrid', hybridGroups: 2, hybridAdvancing: 2 },
    1,
    8
  );
  assert.equal(errors, null);
  assert.equal(data.first_stage_format, 'round_robin');
  assert.equal(data.second_stage_format, 'single_elimination');
});
