const { getSportRules } = require('../config/sportRules.config');

const LOBBY_TOURNAMENT_SIZES = [8, 16, 32, 64];

const toPositiveInt = (value, fieldName, errors, { allowZero = false, defaultValue = null } = {}) => {
  if (value === undefined || value === null || value === '') return defaultValue;

  const parsed = parseInt(value, 10);
  const min = allowZero ? 0 : 1;
  if (isNaN(parsed) || parsed < min) {
    errors.push(`${fieldName} must be a ${allowZero ? 'non-negative' : 'positive'} integer.`);
    return defaultValue;
  }

  return parsed;
};

const isRoundScoringSport = (rules) => (
  rules
  && rules.formats.includes('round_scoring')
  && !rules.formats.includes('round_robin')
);

const getLobbyPreset = (playerCount, lobbySize = 8) => {
  if (!LOBBY_TOURNAMENT_SIZES.includes(playerCount) || playerCount === lobbySize) return null;
  const groupCount = playerCount / lobbySize;
  const advancePerGroup = lobbySize / groupCount;
  return { group_count: groupCount, advance_per_group: advancePerGroup };
};

const normalizeHybridStructure = (body, errors, rules) => {
  const stageInput = Array.isArray(body.stages) ? body.stages : null;
  const inputStageOne = stageInput?.[0] || {};
  const scoringSport = isRoundScoringSport(rules);
  const defaultFirstStage = scoringSport ? 'round_scoring' : 'round_robin';

  if (stageInput && stageInput.length > 2) {
    errors.push('Hybrid tournaments support a maximum of 2 stages.');
  }

  const firstStageFormat = inputStageOne.format || body.first_stage_format || defaultFirstStage;
  if (!scoringSport && firstStageFormat !== 'round_robin') {
    errors.push('Stage 1 must use round_robin.');
  }
  if (scoringSport && firstStageFormat !== 'round_scoring') {
    errors.push('Stage 1 must use round_scoring for scoring sports.');
  }

  const groupCount = toPositiveInt(
    inputStageOne.group_count ?? inputStageOne.groupCount ?? body.group_count ?? body.hybridGroups,
    'group_count',
    errors,
    { defaultValue: 1 }
  );
  const advancePerGroup = toPositiveInt(
    inputStageOne.advance_per_group ?? inputStageOne.advancePerGroup ?? body.advance_per_group ?? body.hybridAdvancing,
    'advance_per_group',
    errors,
    { defaultValue: 1 }
  );

  return { group_count: groupCount, advance_per_group: advancePerGroup };
};

const parseSetsPerMatch = (body, errors) => {
  const parsed = toPositiveInt(
    body.sets_per_match ?? body.setsPerMatch,
    'sets_per_match',
    errors,
    { defaultValue: 1 }
  );
  if (parsed != null && parsed > 20) {
    errors.push('sets_per_match must be 20 or fewer.');
    return 1;
  }
  return parsed || 1;
};

function validateFormatConfigDto(body, sp_id, participantCount = null) {
  const errors = [];
  const { tour_format, group_count, advance_per_group } = body;

  if (!tour_format) {
    errors.push('tour_format is required.');
    return { data: null, errors };
  }

  if (!sp_id) {
    errors.push('Sport must be selected (Step 2) before configuring format.');
    return { data: null, errors };
  }

  const rules = getSportRules(sp_id);
  if (!rules) {
    errors.push(`No rules found for sport id ${sp_id}.`);
    return { data: null, errors };
  }

  if (!rules.formats.includes(tour_format)) {
    errors.push(
      `'${rules.sport_name}' does not support the '${tour_format}' format. ` +
      `Allowed formats: ${rules.formats.join(', ')}.`
    );
    return { data: null, errors };
  }

  const setsPerMatch = parseSetsPerMatch(body, errors);
  const scoringSport = isRoundScoringSport(rules);
  const parsedParticipantCount = participantCount != null ? Number(participantCount) : null;

  if (rules.lobby_size && parsedParticipantCount != null) {
    if (!LOBBY_TOURNAMENT_SIZES.includes(parsedParticipantCount)) {
      errors.push(
        `${rules.sport_name} requires 8, 16, 32, or 64 players. You currently have ${parsedParticipantCount}.`
      );
    } else if (parsedParticipantCount === 8 && tour_format !== 'round_scoring') {
      errors.push(`${rules.sport_name} with 8 players must use single round scoring format.`);
    } else if (parsedParticipantCount > 8 && tour_format !== 'hybrid') {
      errors.push(`${rules.sport_name} with ${parsedParticipantCount} players must use multi-round hybrid format.`);
    }
  }

  if (tour_format === 'hybrid') {
    const hybridConfig = normalizeHybridStructure(body, errors, rules);

    const firstStageFormat = scoringSport ? 'round_scoring' : 'round_robin';
    const secondStageFormat = scoringSport
      ? 'round_scoring'
      : (body.second_stage_format || 'single_elimination');

    const allowedSecondStageFormats = scoringSport
      ? ['round_scoring']
      : ['single_elimination', 'double_elimination', 'round_scoring'];

    if (!allowedSecondStageFormats.includes(secondStageFormat)) {
      errors.push(`Invalid second stage format '${secondStageFormat}'. Allowed formats: ${allowedSecondStageFormats.join(', ')}.`);
    }

    let resolvedGroupCount = hybridConfig.group_count;
    let resolvedAdvancePerGroup = hybridConfig.advance_per_group;

    if (rules.lobby_size && parsedParticipantCount != null && LOBBY_TOURNAMENT_SIZES.includes(parsedParticipantCount)) {
      const preset = getLobbyPreset(parsedParticipantCount, rules.lobby_size);
      if (preset) {
        resolvedGroupCount = preset.group_count;
        resolvedAdvancePerGroup = preset.advance_per_group;
      }
    }

    if (errors.length > 0) {
      return { data: null, errors };
    }

    return {
      errors: null,
      data: {
        tour_format,
        group_count: resolvedGroupCount,
        advance_per_group: resolvedAdvancePerGroup,
        first_stage_format: firstStageFormat,
        second_stage_format: secondStageFormat,
        sets_per_match: setsPerMatch,
      }
    };
  }

  const validGroupCount = toPositiveInt(group_count, 'group_count', errors, { defaultValue: 1 });
  const validAdvancePerGroup = toPositiveInt(advance_per_group, 'advance_per_group', errors, {
    allowZero: true,
    defaultValue: 0
  });

  if (errors.length > 0) {
    return { data: null, errors };
  }

  return {
    errors: null,
    data: {
      tour_format,
      group_count: validGroupCount,
      advance_per_group: validAdvancePerGroup,
      sets_per_match: tour_format === 'round_scoring' ? setsPerMatch : 1,
    }
  };
}

module.exports = {
  validateFormatConfigDto,
  isRoundScoringSport,
  getLobbyPreset,
  LOBBY_TOURNAMENT_SIZES,
};
