import axios from "../config/apiEndpoints";
import { getAccessToken, withAuthHeader } from "./AuthService";

export async function getDashboardStats() {
  const token = await getAccessToken();
  const response = await axios.get('/api/admin/dashboard', withAuthHeader(token));
  return response.data;
}
