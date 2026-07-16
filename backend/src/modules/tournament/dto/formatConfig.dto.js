const { getSportRules } = require('../config/sportRules.config');

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

const HYBRID_FIRST_STAGE_FORMAT = 'round_robin';

const normalizeHybridStructure = (body, errors) => {
  const stageInput = Array.isArray(body.stages) ? body.stages : null;
  const inputStageOne = stageInput?.[0] || {};

  if (stageInput && stageInput.length > 2) {
    errors.push('Hybrid tournaments support a maximum of 2 stages.');
  }

  const firstStageFormat = inputStageOne.format || body.first_stage_format || HYBRID_FIRST_STAGE_FORMAT;
  if (firstStageFormat !== HYBRID_FIRST_STAGE_FORMAT) {
    errors.push(`Stage 1 must use ${HYBRID_FIRST_STAGE_FORMAT}.`);
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

function validateFormatConfigDto(body, sp_id) {
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

  if (tour_format === 'hybrid') {
    const hybridConfig = normalizeHybridStructure(body, errors);

    if (errors.length > 0) {
      return { data: null, errors };
    }

    return {
      errors: null,
      data: {
        tour_format,
        group_count: hybridConfig.group_count,
        advance_per_group: hybridConfig.advance_per_group,
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
    }
  };
}

module.exports = { validateFormatConfigDto };
