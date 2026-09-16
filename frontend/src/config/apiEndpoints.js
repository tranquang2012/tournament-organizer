import axios from 'axios';

const axiosInstance = axios.create({
  // Empty baseURL = same-origin; nginx (Docker) and Vite dev proxy forward /api to the backend.
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  }
);

export default axiosInstance;
