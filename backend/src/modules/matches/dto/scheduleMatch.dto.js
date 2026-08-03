function validateScheduleDto(body) {
  const errors = [];
  const { scheduled_start, scheduled_end } = body;

  // ── scheduled_start ───────────────────────────────────────────────────────
  if (!scheduled_start) {
    errors.push('scheduled_start is required.');
  } else if (isNaN(Date.parse(scheduled_start))) {
    errors.push('scheduled_start must be a valid ISO 8601 datetime (e.g. 2026-07-01T09:00:00Z).');
  }

  // ── scheduled_end ─────────────────────────────────────────────────────────
  if (!scheduled_end) {
    errors.push('scheduled_end is required.');
  } else if (isNaN(Date.parse(scheduled_end))) {
    errors.push('scheduled_end must be a valid ISO 8601 datetime (e.g. 2026-07-01T10:00:00Z).');
  }

  // ── Cross-field: end must be after start ──────────────────────────────────
  if (scheduled_start && scheduled_end
      && !isNaN(Date.parse(scheduled_start))
      && !isNaN(Date.parse(scheduled_end))) {

    const start = new Date(scheduled_start);
    const end   = new Date(scheduled_end);

    if (end <= start) {
      errors.push('scheduled_end must be after scheduled_start.');
    }

    // Sanity check: match shouldn't be longer than 24 hours
    const diffHours = (end - start) / (1000 * 60 * 60);
    if (diffHours > 24) {
      errors.push('Match duration cannot exceed 24 hours.');
    }
  }

  if (errors.length > 0) return { data: null, errors };

  return {
    errors: null,
    data: {
      scheduled_start: new Date(scheduled_start).toISOString(),
      scheduled_end:   new Date(scheduled_end).toISOString(),
    },
  };
}

module.exports = { validateScheduleDto };