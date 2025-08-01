import { useQuery } from '@tanstack/react-query';
import { queryKeys, queryConfig } from '@/lib/cache-config';
import { axiosInstance } from '@/lib/axios';
import { BillingType, VehicleType } from '@/types/enums';

// --- Type Definitions for Billing API Response ---

// This represents the summary part of the data (stat cards, chart)
export interface BillingSummary {
  totalRevenue: number;
  totalSessions: number;
  averageRevenuePerSession: number;
  breakdown: {
    hourly: {
      revenue: number;
      sessions: number;
    };
    dayPass: {
      revenue: number;
      sessions: number;
    };
  };
}

// This represents a single row in the transactions table
export interface CompletedSession {
    _id: string;
    numberPlate: string;
    vehicleType: VehicleType;
    slotNumber: string;
    entryTime: string;
    exitTime: string;
    duration: number; // in minutes
    billingType: BillingType;
    billingAmount: number;
}

// This is the full shape of the data returned by the API endpoint
export interface BillingData {
    summary: BillingSummary;
    transactions: CompletedSession[];
}

export type Period = 'today' | 'week' | 'month';

async function getBillingSummary(period: Period, page: number): Promise<BillingData> {
  const response = await axiosInstance.get(`/billing/summary?period=${period}&page=${page}&limit=10`);
  return response.data.data;
}

export function useBillingSummaryQuery(period: Period, page: number) {
  return useQuery({
    // The query key now includes the page to cache each page separately
    queryKey: [queryKeys.billingSummary(period)[0], period, page],
    queryFn: () => getBillingSummary(period, page),
    ...queryConfig.billingSummary,
    placeholderData: (previousData) => previousData, // Keep showing old data while new data loads
  });
}