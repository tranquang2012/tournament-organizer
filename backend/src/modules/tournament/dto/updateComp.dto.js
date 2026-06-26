function validateUpdateCompetitorDto(body) {
  const errors = [];
  const { comp_name, comp_logo } = body;

  //At least one field must be provided
  if (comp_name === undefined && comp_logo === undefined) {
    errors.push('At least one field (comp_name or comp_logo) must be provided.');
    return { data: null, errors };
  }

  //name validation
  if (comp_name !== undefined) {
    if (typeof comp_name !== 'string' || !comp_name.trim()) {
      errors.push('comp_name must be a non-empty string.');
    } else if (comp_name.trim().length > 150) {
      errors.push('comp_name must be 150 characters or fewer.');
    }
  }

  //logo validation must be a valid URL
  if (comp_logo !== undefined && comp_logo !== null && comp_logo !== '') {
    try {
      new URL(comp_logo);
    } catch {
      errors.push('comp_logo must be a valid URL (e.g. https://example.com/logo.png).');
    }
  }

  if (errors.length > 0) return { data: null, errors };

  const data = {};
  if (comp_name !== undefined) data.comp_name = comp_name.trim();
  if (comp_logo !== undefined) data.comp_logo = comp_logo || null; //nullable

  return { data, errors: null };
}

module.exports = { validateUpdateCompetitorDto };