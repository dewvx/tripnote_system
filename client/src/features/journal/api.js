import { api } from '../../lib/axios.js';

// ส่ง clientId เดิมซ้ำได้อย่างปลอดภัย server คืนบันทึกเดิมแทนการสร้างใหม่
export async function createEntry({ tripId, ...input }) {
  const { data } = await api.post(`/trips/${tripId}/journal-entries`, input);
  return data.data;
}

export async function updateEntry({ tripId, entryId, ...input }) {
  const { data } = await api.patch(`/trips/${tripId}/journal-entries/${entryId}`, input);
  return data.data;
}

export async function deleteEntry({ tripId, entryId }) {
  await api.delete(`/trips/${tripId}/journal-entries/${entryId}`);
}

export async function getTimeline(tripId) {
  const { data } = await api.get(`/trips/${tripId}/timeline`);
  return data.data;
}
