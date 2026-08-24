function validateResumeDto(body) {
  const errors = [];
  const { scheduled_end } = body;

  if (!scheduled_end) {
    errors.push('scheduled_end is required when resuming a match.');
    return { data: null, errors };
  }

  if (isNaN(Date.parse(scheduled_end))) {
    errors.push('scheduled_end must be a valid ISO 8601 datetime (e.g. 2026-07-01T11:00:00Z).');
    return { data: null, errors };
  }

  return {
    errors: null,
    data: {
      scheduled_end: new Date(scheduled_end).toISOString(),
    },
  };
}

module.exports = { validateResumeDto };