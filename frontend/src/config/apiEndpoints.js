import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5001',
});

axiosInstance.interceptors.response.use(
  (response) => {
    const { data } = response;
    return response.data;
  }
);

export default axiosInstance;
