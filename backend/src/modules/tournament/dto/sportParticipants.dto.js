const { getSportRules } = require('../config/sportRules.config');

const VALID_EXPERIENCE = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

function validateSportParticipantsDto(body) {
  const errors = [];
  const { sp_id, participant_type, participants } = body;

  if (sp_id === undefined || sp_id === null || sp_id === '') {
    errors.push('sp_id (sport) is required.');
    return { data: null, errors }; 
  }

  const rules = getSportRules(sp_id);
  if (!rules) {
    errors.push(`sp_id ${sp_id} does not match any supported sport.`);
    return { data: null, errors };
  }

  if (!participant_type) {
    errors.push('participant_type is required.');
  } else if (!['individual', 'team'].includes(participant_type.toLowerCase())) {
    errors.push("participant_type must be 'individual' or 'team'.");
  } else if (!rules.participant_types.includes(participant_type.toLowerCase())) {
    errors.push(
      `'${rules.sport_name}' does not support '${participant_type}' participants. ` +
      `Allowed: ${rules.participant_types.join(', ')}.`
    );
  }

  if (errors.length > 0) return { data: null, errors };

  const type = participant_type.toLowerCase();

  if (participants !== undefined) {
    if (!Array.isArray(participants)) {
      errors.push('participants must be an array.');
    } else {
      participants.forEach((p, i) => {
        if (!p.comp_name || typeof p.comp_name !== 'string' || !p.comp_name.trim()) {
          errors.push(`participants[${i}].comp_name is required.`);
        }

        if (type === 'team') {
          if (!p.comp_size || !Number.isInteger(Number(p.comp_size)) || Number(p.comp_size) < 1) {
            errors.push(`participants[${i}].comp_size must be a positive integer for team type.`);
          }
          if (p.members !== undefined) {
            if (!Array.isArray(p.members)) {
              errors.push(`participants[${i}].members must be an array.`);
            } else {
              p.members.forEach((m, j) => {
                if (!m.mem_name || typeof m.mem_name !== 'string' || !m.mem_name.trim()) {
                  errors.push(`participants[${i}].members[${j}].mem_name is required.`);
                }
                if (m.mem_expe && !VALID_EXPERIENCE.includes(m.mem_expe)) {
                  errors.push(
                    `participants[${i}].members[${j}].mem_expe must be one of: ${VALID_EXPERIENCE.join(', ')}.`
                  );
                }
              });
            }
          }
        }

        if (type === 'individual') {
          if (p.mem_expe && !VALID_EXPERIENCE.includes(p.mem_expe)) {
            errors.push(
              `participants[${i}].mem_expe must be one of: ${VALID_EXPERIENCE.join(', ')}.`
            );
          }
        }
      });
    }
  }

  if (errors.length > 0) return { data: null, errors };

  return {
    errors: null,
    data: {
      sp_id:            Number(sp_id),
      participant_type: type,
      participants:     participants || [],
      _rules:           rules,
    },
  };
}

module.exports = { validateSportParticipantsDto };