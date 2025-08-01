'use server';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys, queryConfig } from '@/lib/cache-config';
import { SlotStatus, SlotType } from '@/types/enums';
import { axiosInstance } from '@/lib/axios';

export interface ParkingSlotData {
  _id: string;
  slotNumber: string;
  slotType: SlotType;
  status: SlotStatus;
  floor: string;
}

interface UpdateSlotStatusPayload {
  slotId: string;
  status: SlotStatus.MAINTENANCE | SlotStatus.AVAILABLE;
  reason?: string;
}

async function getAllSlots(): Promise<ParkingSlotData[]> {
  const response = await axiosInstance.get('/parking/slots');
  return response.data.data;
}

export function useAllSlotsQuery() {
  return useQuery({
    queryKey: queryKeys.allSlots,
    queryFn: getAllSlots,
    ...queryConfig.allSlots,
  });
}

async function updateSlotStatus(payload: UpdateSlotStatusPayload): Promise<ParkingSlotData> {
  const { slotId, ...body } = payload;
  const response = await axiosInstance.put(`/parking/slots/${slotId}/maintenance`, body);
  return response.data.data;
}

export function useUpdateSlotStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSlotStatus,
    onSuccess: (data) => {
      toast.success(`Slot ${data.slotNumber} status updated to ${data.status}.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.allSlots });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || error.message || 'Update failed';
      toast.error(`Update failed: ${message}`);
    },
  });
}