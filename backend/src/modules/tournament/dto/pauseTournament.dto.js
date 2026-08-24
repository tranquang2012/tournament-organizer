function validatePauseDto(body) {
  const errors = [];
  const { pause_date } = body;

  if (!pause_date) {
    errors.push('pause_date is required.');
    return { data: null, errors };
  }

  if (isNaN(Date.parse(pause_date))) {
    errors.push('pause_date must be a valid ISO 8601 date (e.g. 2026-08-24).');
    return { data: null, errors };
  }

  return {
    errors: null,
    data: { pause_date: new Date(pause_date).toISOString() },
  };
}

function validateResumeDto(body) {
  const errors = [];
  const { resume_date } = body;

  if (!resume_date) {
    errors.push('resume_date is required.');
    return { data: null, errors };
  }

  if (isNaN(Date.parse(resume_date))) {
    errors.push('resume_date must be a valid ISO 8601 date (e.g. 2026-08-26).');
    return { data: null, errors };
  }

  return {
    errors: null,
    data: { resume_date: new Date(resume_date).toISOString() },
  };
}

module.exports = { validatePauseDto, validateResumeDto };