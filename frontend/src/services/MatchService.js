import axiosInstance from '../config/apiEndpoints';
import { getAccessToken, withAuthHeader } from './AuthService';

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
