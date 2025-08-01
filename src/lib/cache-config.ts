// lib/cache-config.ts
export const queryKeys = {
  dashboard: ['dashboardData'] as const,
  allSlots: ['allSlots'] as const,
};

export const queryConfig = {
  dashboard: {
    staleTime: 1000 * 60 * 5,         // 5 minutes
    gcTime: 1000 * 60 * 10,           // 10 minutes
    refetchInterval: 1000 * 60 * 5,   // 5 minutes
  },
  allSlots: {
    staleTime: 1000 * 60 * 5,         // 5 minutes
    gcTime: 1000 * 60 * 10,           // 10 minutes
    refetchInterval: 1000 * 60 * 2,   // 2 minutes
  },
};