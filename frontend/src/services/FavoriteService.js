import axiosInstance from '../config/apiEndpoints';
import { getAccessToken, withAuthHeader } from './AuthService';

const getAuthConfig = async () => {
  const token = await getAccessToken();
  return withAuthHeader(token);
};

export const listFavorites = async () => {
  const response = await axiosInstance.get('/api/favorites', await getAuthConfig());
  return response.data || [];
};

export const getFavoriteStatus = async (tournamentId) => {
  const response = await axiosInstance.get(
    `/api/favorites/${tournamentId}/status`,
    await getAuthConfig(),
  );
  return response.data;
};

export const addFavorite = async (tournamentId) => {
  const response = await axiosInstance.post(
    `/api/favorites/${tournamentId}`,
    {},
    await getAuthConfig(),
  );
  return response.data;
};

export const removeFavorite = async (tournamentId) => {
  const response = await axiosInstance.delete(
    `/api/favorites/${tournamentId}`,
    await getAuthConfig(),
  );
  return response.data;
};
