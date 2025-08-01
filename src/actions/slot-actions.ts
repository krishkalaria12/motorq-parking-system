/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { axiosInstance } from '@/lib/axios';
import { queryKeys, queryConfig } from '@/lib/cache-config';
import { SlotStatus, SlotType } from '@/types/enums';

// --- Types ---
export interface ParkingSlotData {
  _id: string;
  slotNumber: string;
  slotType: SlotType;
  status: SlotStatus;
  floor: string;
}

interface SlotCreationPayload {
  floor: string;
  slotNumber: string;
  slotType: SlotType;
}

interface UpdateSlotStatusPayload {
  slotId: string;
  status: SlotStatus.MAINTENANCE | SlotStatus.AVAILABLE;
  reason?: string;
}

// --- Queries ---
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

// --- Mutations ---

// 1. Add multiple slots
async function addSlots(payload: { slots: SlotCreationPayload[] }): Promise<void> {
  const response = await axiosInstance.post('/parking/slots', payload.slots);
  return response.data.data;
}

export function useAddSlotsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addSlots,
    onSuccess: () => {
      toast.success("New slots have been added successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.allSlots });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || error.message || 'Failed to create slots';
      toast.error(`Failed to add slots: ${message}`);
    },
  });
}

// 2. Update slot status (e.g., mark as maintenance)
async function updateSlotStatus(payload: UpdateSlotStatusPayload): Promise<ParkingSlotData> {
  const { slotId, ...body } = payload;
  const response = await axiosInstance.put(`/parking/slot/${slotId}/maintenance`, body);
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