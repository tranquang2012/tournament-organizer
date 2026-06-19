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

const buildRandomizedTeamParticipants = (players = [], numberOfTeams) => {
  const teamCount = Number(numberOfTeams) || 0;
  if (teamCount < 1) return [];

  const teams = Array.from({ length: teamCount }, (_, index) => ({
    comp_name: `Team ${index + 1}`,
    members: [],
  }));

  [...players]
    .sort(() => Math.random() - 0.5)
    .forEach((player, index) => {
      teams[index % teamCount].members.push({
        mem_name: player.name,
        mem_expe: normalizeExperience(player.experience),
      });
    });

  return teams.map((team) => ({
    ...team,
    comp_size: Math.max(team.members.length, 1),
  }));
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

export const deleteTournament = async (tournamentId) => {
  const authConfig = await withTournamentAuth();
  return axios.delete(`/api/tournaments/${tournamentId}`, authConfig);
};

export const discardTournamentDraft = async (tournamentId) => {
  const authConfig = await withTournamentAuth();
  return axios.delete(`/api/tournaments/${tournamentId}/discard`, authConfig);
};