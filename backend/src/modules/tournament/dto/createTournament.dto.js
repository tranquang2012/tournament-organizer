/**
 * Validates and sanitizes the General Details (Step 1) payload.
 * @param {object} body - req.body
 * @returns {{ data: object|null, errors: string[]|null }}
 */
function validateCreateTournamentDto(body) {
  const errors = [];

  const {
    tournament_name,
    description,
    location,
    start_date,
    end_date,
    banner_image_url,
  } = body;

  // --- Required fields ---
  if (!tournament_name || typeof tournament_name !== 'string' || !tournament_name.trim()) {
    errors.push('tournament_name is required.');
  } else if (tournament_name.trim().length > 150) {
    errors.push('tournament_name must be 150 characters or fewer.');
  }

  if (!start_date) {
    errors.push('start_date is required.');
  } else if (isNaN(Date.parse(start_date))) {
    errors.push('start_date must be a valid date (mm/dd/yyyy or ISO format).');
  }

  if (!end_date) {
    errors.push('end_date is required.');
  } else if (isNaN(Date.parse(end_date))) {
    errors.push('end_date must be a valid date (mm/dd/yyyy or ISO format).');
  }

  // Cross-field: end must be after start
  if (start_date && end_date && !isNaN(Date.parse(start_date)) && !isNaN(Date.parse(end_date))) {
    if (new Date(end_date) < new Date(start_date)) {
      errors.push('end_date must be on or after start_date.');
    }
  }

  // --- Optional fields ---
  if (description && typeof description === 'string' && description.trim().length > 2000) {
    errors.push('description must be 2000 characters or fewer.');
  }

  if (location && typeof location === 'string' && location.trim().length > 200) {
    errors.push('location must be 200 characters or fewer.');
  }

  if (banner_image_url && typeof banner_image_url === 'string') {
    try {
      new URL(banner_image_url);
    } catch {
      errors.push('banner_image_url must be a valid URL.');
    }
  }

  if (errors.length > 0) return { data: null, errors };

  return {
    errors: null,
    data: {
        tour_name:       tournament_name.trim(),
        tour_descrip:    description ? description.trim() : null,
        tour_locat:      location ? location.trim() : null,
        tour_startdate:  new Date(start_date).toISOString(),
        tour_enddate:    new Date(end_date).toISOString(),
        tour_banner:     banner_image_url || null,
    },
    };
}

module.exports = { validateCreateTournamentDto };