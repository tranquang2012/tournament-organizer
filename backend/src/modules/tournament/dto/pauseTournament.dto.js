function normalizeDateOnly(value) {
  if (typeof value !== 'string') return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value.trim());
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${yearText}-${monthText}-${dayText}`;
}

function validatePauseDto(body) {
  const errors = [];
  const { pause_date } = body;

  if (!pause_date) {
    errors.push('pause_date is required.');
    return { data: null, errors };
  }

  const normalizedPauseDate = normalizeDateOnly(pause_date);
  if (!normalizedPauseDate) {
    errors.push('pause_date must be a valid ISO 8601 date (e.g. 2026-08-24).');
    return { data: null, errors };
  }

  return {
    errors: null,
    data: { pause_date: normalizedPauseDate },
  };
}

function validateResumeDto(body) {
  const errors = [];
  const { resume_date } = body;

  if (!resume_date) {
    errors.push('resume_date is required.');
    return { data: null, errors };
  }

  const normalizedResumeDate = normalizeDateOnly(resume_date);
  if (!normalizedResumeDate) {
    errors.push('resume_date must be a valid ISO 8601 date (e.g. 2026-08-26).');
    return { data: null, errors };
  }

  return {
    errors: null,
    data: { resume_date: normalizedResumeDate },
  };
}

module.exports = { validatePauseDto, validateResumeDto };