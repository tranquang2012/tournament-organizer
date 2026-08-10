import axios from '../config/apiEndpoints';
import { getAccessToken, withAuthHeader } from './AuthService';

const EXPERIENCE_MAP = {
  Beginner: 'Beginner',
  Intermediate: 'Intermediate',
  Advanced: 'Advanced',
  Pro: 'Professional',
  Professional: 'Professional',
};

let cachedSportRules = null;

const getSportRules = async () => {
  if (cachedSportRules) return cachedSportRules;

  const response = await axios.get('/api/tournaments/sport-rules');
  cachedSportRules = response.data || {};
  return cachedSportRules;
};

const normalizeExperience = (experience) => EXPERIENCE_MAP[experience] || 'Beginner';

const toAbsoluteUrl = (src) => {
  if (!src) return null;

  try {
    return new URL(src, window.location.origin).href;
  } catch {
    return null;
  }
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();

  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

const getSportIdByName = async (sportName) => {
  const rules = await getSportRules();
  const match = Object.entries(rules).find(([, rule]) => rule.sport_name === sportName);

  return match ? Number(match[0]) : null;
};

const buildGeneralDetailsPayload = async (data) => {
  const bannerUrl = data.banner
    ? await fileToDataUrl(data.banner)
    : toAbsoluteUrl(data.defaultBannerSrc);

  return {
    tournament_name: data.name,
    description: data.description,
    location: data.location,
    start_date: data.startDate,
    end_date: data.endDate,
    banner_image_url: bannerUrl,
  };
};

const buildPredefinedTeamParticipants = (teams = []) =>
  teams.map((team) => ({
    comp_name: team.name,
    comp_size: Math.max(team.members?.length || 0, 1),
    members: (team.members || []).map((member) => ({
      mem_name: member.name,
      mem_expe: normalizeExperience(member.experience),
    })),
  }));

const EXP_VALUES = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Professional: 4,
  Pro: 4,
};

export const buildRandomizedTeamParticipants = (players = [], numberOfTeams) => {
  const teamCount = Number(numberOfTeams) || 0;
  if (teamCount < 1) return [];

  const teams = Array.from({ length: teamCount }, (_, index) => ({
    comp_name: `Team ${index + 1}`,
    members: [],
  }));

  const getPlayerExpValue = (player) => {
    const exp = normalizeExperience(player.experience);
    return EXP_VALUES[exp] || 1;
  };

  const sortedPlayers = [...players].sort((a, b) => getPlayerExpValue(b) - getPlayerExpValue(a));
  const teamSizeLimit = Math.ceil(players.length / teamCount);

  // Balanced draft distribution
  for (const player of sortedPlayers) {
    const candidates = teams.filter((t) => t.members.length < teamSizeLimit);
    if (candidates.length === 0) break;

    let bestTeam = candidates[0];
    let minSum = Infinity;

    for (const team of candidates) {
      const sum = team.members.reduce((acc, m) => acc + (EXP_VALUES[m.mem_expe] || 1), 0);
      if (sum < minSum) {
        minSum = sum;
        bestTeam = team;
      } else if (sum === minSum) {
        if (team.members.length < bestTeam.members.length) {
          bestTeam = team;
        }
      }
    }

    bestTeam.members.push({
      mem_name: player.name,
      mem_expe: normalizeExperience(player.experience),
    });
  }

  // Local optimization (iterative swapping) to minimize gap between average experience
  const calculateTeamAvg = (team) => {
    if (team.members.length === 0) return 0;
    const total = team.members.reduce((sum, m) => sum + (EXP_VALUES[m.mem_expe] || 1), 0);
    return total / team.members.length;
  };

  const getGap = (currentTeams) => {
    let minAvg = Infinity;
    let maxAvg = -Infinity;
    for (const t of currentTeams) {
      const avg = calculateTeamAvg(t);
      if (avg < minAvg) minAvg = avg;
      if (avg > maxAvg) maxAvg = avg;
    }
    return maxAvg - minAvg;
  };

  let bestGap = getGap(teams);
  let improved = true;
  let iterations = 0;
  const maxIterations = 100;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const teamA = teams[i];
        const teamB = teams[j];

        for (let idxA = 0; idxA < teamA.members.length; idxA++) {
          for (let idxB = 0; idxB < teamB.members.length; idxB++) {
            const memA = teamA.members[idxA];
            const memB = teamB.members[idxB];

            if (memA.mem_expe === memB.mem_expe) continue;

            teamA.members[idxA] = memB;
            teamB.members[idxB] = memA;

            const newGap = getGap(teams);
            if (newGap < bestGap) {
              bestGap = newGap;
              improved = true;
            } else {
              teamA.members[idxA] = memA;
              teamB.members[idxB] = memB;
            }
          }
        }
      }
    }
  }

  const finalGap = getGap(teams);

  const result = teams.map((team) => ({
    ...team,
    comp_size: Math.max(team.members.length, 1),
  }));
  result.finalGap = finalGap;
  return result;
};

const buildIndividualParticipants = (participants = []) =>
  participants.map((participant) => ({
    comp_name: participant.name,
    mem_expe: normalizeExperience(participant.experience),
  }));

const buildSportParticipantsPayload = async (data) => {
  const spId = await getSportIdByName(data.sport);
  let participants;

  if (data.participantType === 'team') {
    participants = data.teamMode === 'randomize'
      ? buildRandomizedTeamParticipants(data.participants, data.numberOfTeams)
      : buildPredefinedTeamParticipants(data.teams);
  } else {
    participants = buildIndividualParticipants(data.participants);
  }

  return {
    sp_id: spId,
    participant_type: data.participantType,
    participants,
  };
};

const buildFormatConfigPayload = (data) => ({
  tour_format: data.format,
  group_count: data.format === 'hybrid' ? Number(data.hybridGroups) : undefined,
  advance_per_group: data.format === 'hybrid' ? Number(data.hybridAdvancing) : undefined,
  second_stage_format: data.format === 'hybrid' ? data.hybridSecondRound : undefined,
});

const withTournamentAuth = async () => {
  const token = await getAccessToken();
  return withAuthHeader(token);
};

export const createGeneralDetails = async (data) => {
  const authConfig = await withTournamentAuth();
  return axios.post('/api/tournaments', await buildGeneralDetailsPayload(data), authConfig);
};

export const updateGeneralDetails = async (tournamentId, data) => {
  const authConfig = await withTournamentAuth();
  return axios.patch(
    `/api/tournaments/${tournamentId}/general-details`,
    await buildGeneralDetailsPayload(data),
    authConfig,
  );
};

export const saveSportAndParticipants = async (tournamentId, data) => {
  const authConfig = await withTournamentAuth();
  return axios.patch(
    `/api/tournaments/${tournamentId}/sport-participants`,
    await buildSportParticipantsPayload(data),
    authConfig,
  );
};

export const saveFormatConfig = async (tournamentId, data) => {
  const authConfig = await withTournamentAuth();
  return axios.patch(
    `/api/tournaments/${tournamentId}/format-config`,
    buildFormatConfigPayload(data),
    authConfig,
  );
};

export const getReview = async (tournamentId) => {
  const authConfig = await withTournamentAuth();
  return axios.get(`/api/tournaments/${tournamentId}/review`, authConfig);
};

export const publishTournament = async (tournamentId) => {
  const authConfig = await withTournamentAuth();
  return axios.patch(`/api/tournaments/${tournamentId}/publish`, {}, authConfig);
};

export const getTournaments = async () => {
  const authConfig = await withTournamentAuth();
  const response = await axios.get('/api/tournaments', authConfig);
  return response.data || [];
};

export const getPublicTournaments = async (sportId) => {
  const url = sportId ? `/api/tournaments/public?sportId=${sportId}` : '/api/tournaments/public';
  const response = await axios.get(url);
  return response.data || [];
};


export const getTournamentById = async (tournamentId) => {
  const authConfig = await withTournamentAuth();
  const response = await axios.get(`/api/tournaments/${tournamentId}/review`, authConfig);
  return response?.data || null;
};

export const getParticipants = async (tournamentId) => {
  const response = await axios.get(`/api/tournaments/${tournamentId}/participants`);
  return response?.data || [];
};

export const updateTournamentDetails = async (tournamentId, data) => {
  return updateGeneralDetails(tournamentId, data);
};

export const updateMember = async (memberId, data) => {
  const authConfig = await withTournamentAuth();
  return axios.patch(`/api/tournaments/participants/members/${memberId}`, data, authConfig);
};

export const updateCompetitor = async (tournamentId, competitorId, data) => {
  const authConfig = await withTournamentAuth();
  return axios.patch(`/api/tournaments/${tournamentId}/competitors/${competitorId}`, data, authConfig);
};

export const deleteTournament = async (tournamentId) => {
  const authConfig = await withTournamentAuth();
  return axios.delete(`/api/tournaments/${tournamentId}`, authConfig);
};

export const discardTournamentDraft = async (tournamentId) => {
  const authConfig = await withTournamentAuth();
  return axios.delete(`/api/tournaments/${tournamentId}/discard`, authConfig);
};

export const getPublicTournamentById = async (tournamentId) => {
  const response = await axios.get(`/api/tournaments/${tournamentId}/public`);
  return response?.data || null;
};

export const getTournamentBracket = async (tournamentId) => {
  const response = await axios.get(`/api/tournaments/${tournamentId}/bracket`);
  return response?.data || [];
};

export const getTournamentBrackets = async (tournamentId) => {
  const response = await axios.get(`/api/tournaments/${tournamentId}/brackets`);
  return response?.data || [];
};

export const getTournamentRankings = async (tournamentId) => {
  const response = await axios.get(`/api/tournaments/${tournamentId}/rankings`);
  return response?.data || null;
};

// --- STAT TEMPLATES ---

export const getStatTemplates = async (tournamentId) => {
  const authConfig = await withTournamentAuth();
  const response = await axios.get(`/api/tournaments/${tournamentId}/stat-templates`, authConfig);
  return response?.data || [];
};

export const createStatTemplate = async (tournamentId, payload) => {
  const authConfig = await withTournamentAuth();
  const response = await axios.post(`/api/tournaments/${tournamentId}/stat-templates`, payload, authConfig);
  return response?.data;
};

export const deleteStatTemplate = async (tournamentId, templateId) => {
  const authConfig = await withTournamentAuth();
  const response = await axios.delete(`/api/tournaments/${tournamentId}/stat-templates/${templateId}`, authConfig);
  return response?.data;
};