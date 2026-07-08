const { getSportRules } = require('../config/sportRules.config');

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

  let validGroupCount = 1;
  if (group_count !== undefined && group_count !== null) {
    validGroupCount = parseInt(group_count, 10);
    if (isNaN(validGroupCount) || validGroupCount < 1) {
      errors.push('group_count must be a positive integer.');
    }
  }

  let validAdvancePerGroup = 0;
  if (advance_per_group !== undefined && advance_per_group !== null) {
    validAdvancePerGroup = parseInt(advance_per_group, 10);
    if (isNaN(validAdvancePerGroup) || validAdvancePerGroup < 0) {
      errors.push('advance_per_group must be a non-negative integer.');
    }
  }

  if (errors.length > 0) {
    return { data: null, errors };
  }

  return {
    errors: null,
    data: {
      tour_format,
      group_count: validGroupCount,
      advance_per_group: validAdvancePerGroup
    }
  };
}

module.exports = { validateFormatConfigDto };