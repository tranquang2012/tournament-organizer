const { getSportRules } = require('../config/sportRules.config');

function validateFormatConfigDto(body, sp_id) {
  const errors = [];
  const { tour_format } = body;

  if (!tour_format) {
    errors.push('tour_format is required.');
    return { data: null, errors };
  }

  // ── Validate against sport rules ─────────────────────────────────
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

  return { errors: null, data: { tour_format } };
}

module.exports = { validateFormatConfigDto };