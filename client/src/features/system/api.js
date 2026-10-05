import { api } from '../../lib/axios.js';

export async function getHealth() {
  const { data } = await api.get('/health');
  return data.data;
}
