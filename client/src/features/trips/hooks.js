import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as tripsApi from './api.js';

export const tripKeys = {
  all: ['trips'],
  list: (params = {}) => ['trips', 'list', params],
  detail: (tripId) => ['trips', 'detail', String(tripId)],
};

// 404/403 เป็นคำตอบจริง ลองซ้ำก็ได้ผลเดิม ลองซ้ำเฉพาะเน็ตหลุดหรือ server ล่ม
function retryUnlessClientError(failureCount, error) {
  return failureCount < 1 && !(error?.status >= 400 && error?.status < 500);
}

export function useTrips(params) {
  return useQuery({ queryKey: tripKeys.list(params), queryFn: () => tripsApi.listTrips(params) });
}

export function useTrip(tripId) {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: () => tripsApi.getTrip(tripId),
    retry: retryUnlessClientError,
  });
}

// ทุก mutation ที่คืนทริปตัวเต็ม: ใส่ลง cache ของหน้ารายละเอียดทันที แล้วให้รายการโหลดใหม่
function useTripMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (trip) => {
      queryClient.setQueryData(tripKeys.detail(trip.id), trip);
      queryClient.invalidateQueries({ queryKey: tripKeys.list() });
    },
  });
}

export function useCreateTrip() {
  return useTripMutation(tripsApi.createTrip);
}

export function useUpdateTrip() {
  return useTripMutation(tripsApi.updateTrip);
}

export function useChangeTripStatus() {
  return useTripMutation(tripsApi.changeTripStatus);
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.deleteTrip,
    onSuccess: (_data, tripId) => {
      queryClient.removeQueries({ queryKey: tripKeys.detail(tripId) });
      queryClient.invalidateQueries({ queryKey: tripKeys.list() });
    },
  });
}
