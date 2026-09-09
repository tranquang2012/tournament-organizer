/**
 * Pure validation logic for the Tournament Creation Wizard.
 *
 * Field names mirror the wizard form state (INITIAL_DATA in TournamentCreatePage).
 * Lobby rules mirror backend/src/modules/tournament/dto/sportParticipants.dto.js.
 */

export const LOBBY_TOURNAMENT_SIZES = [8, 16, 32, 64];

export const isValidLobbyCount = (count, lobbySize) => (
  lobbySize ? LOBBY_TOURNAMENT_SIZES.includes(count) : true
);

/** Teams are the competing unit when pre-defined; otherwise the player pool is. */
export const getParticipantCount = (formData) => (
  formData.participantType === 'team' && formData.teamMode === 'predefine'
    ? (formData.teams || []).length
    : (formData.participants || []).length
);

const invalid = (error) => ({ isValid: false, error, updates: null });
const valid = (updates = null) => ({ isValid: true, error: null, updates });

const validateGeneralDetails = (formData) => {
  if (!formData.name?.trim()) return invalid('Tournament name is required');
  if (!formData.startDate) return invalid('Start date is required');
  if (!formData.endDate) return invalid('End date is required');
  if (new Date(formData.endDate) < new Date(formData.startDate)) {
    return invalid('End date must be on or after start date');
  }
  return valid();
};

const validateSportAndParticipants = (formData, lobbySize) => {
  if (!formData.sport) return invalid('Sport is required');

  let updates = null;

  if (formData.participantType === 'individual') {
    if (!(formData.participants || []).length) {
      return invalid('At least one participant is required');
    }
  } else if (formData.participantType === 'team') {
    if (formData.teamMode === 'predefine') {
      const teams = formData.teams || [];
      if (!teams.length) return invalid('At least one team is required');
      if (teams.some((team) => !(team.members || []).length)) {
        return invalid('Every team needs at least one member');
      }
    } else if (formData.teamMode === 'randomize') {
      const playerPoolCount = (formData.participants || []).length;
      const membersPerTeam = Number(formData.membersPerTeam) || 0;

      if (membersPerTeam <= 0) {
        return invalid('Number of members in a team must be greater than 0');
      }
      if (playerPoolCount === 0) return invalid('Player pool cannot be empty');
      if (playerPoolCount % membersPerTeam !== 0) {
        return invalid(
          `Player pool (${playerPoolCount} players) cannot be divided equally into teams of ${membersPerTeam}.`
        );
      }

      updates = { numberOfTeams: playerPoolCount / membersPerTeam };
    }
  }

  const participantCount = getParticipantCount(formData);
  if (lobbySize && !isValidLobbyCount(participantCount, lobbySize)) {
    return invalid(
      `${formData.sport} requires 8, 16, 32, or 64 players (lobbies of ${lobbySize}). You currently have ${participantCount}.`
    );
  }

  return valid(updates);
};

const validateFormatConfig = (formData, isScoringSport) => {
  if (!formData.format) return invalid('Tournament format is required');

  if (formData.format === 'hybrid') {
    if (!formData.hybridGroups || !formData.hybridAdvancing) {
      return invalid('Please configure the first round groups');
    }
    const hybridSecondRound = formData.hybridSecondRound || (isScoringSport ? 'round_scoring' : '');
    if (!hybridSecondRound) {
      return invalid('Please select a format for the second round');
    }
  }

  const usesGamesPerMatch =
    formData.format === 'round_scoring' ||
    formData.hybridSecondRound === 'round_scoring' ||
    (formData.format === 'hybrid' && isScoringSport);

  if (usesGamesPerMatch) {
    const setsPerMatch = Number(formData.setsPerMatch || 1);
    if (!Number.isInteger(setsPerMatch) || setsPerMatch < 1 || setsPerMatch > 20) {
      return invalid('Games per match must be a whole number between 1 and 20');
    }
  }

  return valid();
};

/**
 * Returns { isValid, error, updates }. `updates` carries derived form values the
 * caller must merge back into form state (currently only numberOfTeams).
 */
export const validateWizardStep = (formData, currentStep, options = {}) => {
  const { lobbySize = null, isScoringSport = false } = options;

  if (currentStep === 0) return validateGeneralDetails(formData);
  if (currentStep === 1) return validateSportAndParticipants(formData, lobbySize);
  if (currentStep === 2) return validateFormatConfig(formData, isScoringSport);

  return valid();
};

/** Whether a step has enough data to be marked done in the stepper. */
export const isWizardStepCompleted = (formData, stepIndex, options = {}) => {
  const { lobbySize = null, isScoringSport = false } = options;

  if (stepIndex === 0) {
    return !!(formData.name?.trim() && formData.startDate && formData.endDate);
  }

  if (stepIndex === 1) {
    if (!formData.sport) return false;
    if (lobbySize && !isValidLobbyCount(getParticipantCount(formData), lobbySize)) return false;
    if (formData.participantType === 'individual') {
      return (formData.participants || []).length > 0;
    }
    if (formData.participantType === 'team') {
      if (formData.teamMode === 'randomize') {
        if (!(Number(formData.membersPerTeam) > 0)) return false;
        return (formData.participants || []).length > 0;
      }
      return (formData.teams || []).length > 0;
    }
    return false;
  }

  if (stepIndex === 2) {
    if (formData.format === 'hybrid') {
      const hybridSecondRound = formData.hybridSecondRound || (isScoringSport ? 'round_scoring' : '');
      return !!hybridSecondRound && !!formData.hybridGroups && !!formData.hybridAdvancing;
    }
    return !!formData.format;
  }

  return false; // Review step is never marked complete
};
