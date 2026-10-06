import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { tripKeys } from '../trips/hooks.js';
import * as journalApi from './api.js';

export const journalKeys = {
  // อยู่ใต้ key ของทริป แก้รายจ่ายหรือบันทึกแล้ว invalidate ทริปทีเดียว timeline โหลดใหม่ด้วย
  timeline: (tripId) => [...tripKeys.detail(tripId), 'timeline'],
};

// บันทึก + รายจ่าย เรียงตามเวลา จัดกลุ่มรายวัน คิดที่ server ทั้งหมด
export function useTimeline(tripId) {
  return useQuery({
    queryKey: journalKeys.timeline(tripId),
    queryFn: () => journalApi.getTimeline(tripId),
  });
}

function useEntryMutation(tripId, mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => mutationFn({ tripId, ...input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: journalKeys.timeline(tripId) }),
  });
}

export function useCreateEntry(tripId) {
  return useEntryMutation(tripId, journalApi.createEntry);
}

export function useUpdateEntry(tripId) {
  return useEntryMutation(tripId, journalApi.updateEntry);
}

export function useDeleteEntry(tripId) {
  return useEntryMutation(tripId, journalApi.deleteEntry);
}
