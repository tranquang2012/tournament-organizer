import axios from '../config/apiEndpoints';

export async function getScheduledMatches() {
  const response = await axios.get('/api/matches/calendar');
  return response.data;
}
