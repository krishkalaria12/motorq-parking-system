// actions/parkingActions.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { axiosInstance } from '@/lib/axios';
import { queryKeys, queryConfig } from '@/lib/cache-config';
import { VehicleType, BillingType } from '@/types/enums';

// --- Types ---

interface SlotCounts {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
}

interface ActiveSession {
  _id: string;
  numberPlate: string;
  entryTime: string;
  vehicleId: {
    vehicleType: VehicleType;
  };
  slotId: {
    slotNumber: string;
  };
}

interface DashboardData {
  slotCounts: SlotCounts;
  activeSessions: ActiveSession[];
}

interface CheckInSuccessData {
  session: ActiveSession;
  slot: string;
}



// --- Dashboard Query ---

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

// --- Check-In Mutation ---

interface CheckInPayload {
  numberPlate: string;
  vehicleType: VehicleType;
  billingType: BillingType;
  slotId?: string;
}

async function checkInVehicle(payload: CheckInPayload): Promise<CheckInSuccessData> {
  const res = await axiosInstance.post('/parking/check-in', payload);
  return res.data.data;
}

export function useCheckInMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkInVehicle,
    onSuccess: (data) => {
      toast.success(`Vehicle checked in! Assigned to slot ${data.slot}.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error
        ? error.message
        : 'Something went wrong during check-in.';
      toast.error(`Check-in failed: ${message}`);
    },
  });
}

// --- Check-Out Mutation ---

interface CheckOutPayload {
  sessionId: string;
}

async function checkOutVehicle(payload: CheckOutPayload): Promise<ActiveSession> {
  const res = await axiosInstance.put('/parking/check-out', payload);
  return res.data.data;
}

export function useCheckOutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkOutVehicle,
    onSuccess: (data) => {
      toast.success(`Vehicle ${data.numberPlate} checked out successfully.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error
        ? error.message
        : 'Something went wrong during check-out.';
      toast.error(`Check-out failed: ${message}`);
    },
  });
}