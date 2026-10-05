import { api } from '../../lib/axios.js';

export async function listTrips(params) {
  const { data } = await api.get('/trips', { params });
  return data.data;
}

export async function getTrip(tripId) {
  const { data } = await api.get(`/trips/${tripId}`);
  return data.data;
}

export async function createTrip(input) {
  const { data } = await api.post('/trips', input);
  return data.data;
}

export async function updateTrip({ tripId, ...changes }) {
  const { data } = await api.patch(`/trips/${tripId}`, changes);
  return data.data;
}

export async function changeTripStatus({ tripId, status }) {
  const { data } = await api.patch(`/trips/${tripId}/status`, { status });
  return data.data;
}

export async function deleteTrip(tripId) {
  await api.delete(`/trips/${tripId}`);
}
