// actions/parkingActions.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { axiosInstance } from '@/lib/axios';
import { queryKeys, queryConfig } from '@/lib/cache-config';
import { VehicleType, BillingType, SessionStatus } from '@/types/enums';

interface SlotCounts {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
}

export interface ActiveSession {
  _id: string;
  numberPlate: string;
  entryTime: string;
  vehicleId: {
    vehicleType: VehicleType;
  };
  slotId: {
    slotNumber: string;
  };
  status: SessionStatus;
}

interface DashboardData {
  slotCounts: SlotCounts;
  activeSessions: ActiveSession[];
}

interface CheckInSuccessData {
  session: ActiveSession;
  slot: string;
}

async function getDashboardData(): Promise<DashboardData> {
  const res = await axiosInstance.get('/parking/dashboard');
  return res.data.data;
}

export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboardData,
    staleTime: queryConfig.dashboard.staleTime,
    gcTime: queryConfig.dashboard.gcTime,
    refetchInterval: queryConfig.dashboard.refetchInterval,
  });
}

interface CheckInPayload {
  numberPlate: string;
  vehicleType: VehicleType;
  billingType: BillingType;
  slotId?: string;
}

async function checkInVehicle(payload: CheckInPayload): Promise<CheckInSuccessData> {
  try {
    const res = await axiosInstance.post('/parking/check-in', payload);
    return res.data.data;
  } catch (error: any) {
    // Re-throw the error with the original structure so the component can handle it properly
    throw error;
  }
}

export function useCheckInMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: checkInVehicle,
    onSuccess: (data) => {
      toast.success(`Vehicle checked in! Assigned to slot ${data.slot}.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// --- Check-Out Mutation ---
interface CheckOutPayload {
  sessionId: string;
}

async function checkOutVehicle(payload: CheckOutPayload): Promise<ActiveSession> {
  try {
    const res = await axiosInstance.put('/parking/check-out', payload);
    return res.data.data;
  } catch (error: any) {
    throw error;
  }
}

export function useCheckOutMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: checkOutVehicle,
    onSuccess: (data) => {
      toast.success(`Vehicle ${data.numberPlate} checked out successfully.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || error?.message || 'Something went wrong during check-out.';
      toast.error(`Check-out failed: ${message}`);
    },
  });
}