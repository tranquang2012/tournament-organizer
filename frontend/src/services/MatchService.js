import axiosInstance from '../config/apiEndpoints';
import { getAccessToken, withAuthHeader } from './AuthService';

const getAuthConfig = async () => {
  const token = await getAccessToken();
  return withAuthHeader(token);
};

export const getMatch = async (matchId) => {
  const response = await axiosInstance.get(`/api/matches/${matchId}`);
  return response.data;
};

export const scheduleMatch = async (matchId, scheduledStart, scheduledEnd) => {
  const token = await getAccessToken();
  const authConfig = withAuthHeader(token);

  const response = await axiosInstance.patch(`/api/matches/${matchId}/schedule`, {
    scheduled_start: scheduledStart,
    scheduled_end: scheduledEnd
  }, authConfig);
  return response;
};

export const updateMatch = async (matchId, payload) => {
  const token = await getAccessToken();
  const authConfig = withAuthHeader(token);

  const response = await axiosInstance.patch(`/api/matches/${matchId}`, payload, authConfig);
  return response;
};

// --- MATCH STATS ---

export const getMatchStats = async (matchId) => {
  const response = await axiosInstance.get(`/api/matches/${matchId}/stats`);
  return response.data;
};

export const createMatchStat = async (matchId, payload) => {
  const authConfig = await getAuthConfig();
  const response = await axiosInstance.post(`/api/matches/${matchId}/stats`, payload, authConfig);
  return response.data;
};

export const updateMatchStat = async (matchId, statId, payload) => {
  const authConfig = await getAuthConfig();
  const response = await axiosInstance.patch(`/api/matches/${matchId}/stats/${statId}`, payload, authConfig);
  return response.data;
};

export const deleteMatchStat = async (matchId, statId) => {
  const authConfig = await getAuthConfig();
  const response = await axiosInstance.delete(`/api/matches/${matchId}/stats/${statId}`, authConfig);
  return response.data;
};
