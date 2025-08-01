// lib/cache-config.ts
export const queryKeys = {
  dashboard: ['dashboardData'],
};

export const queryConfig = {
  dashboard: {
    staleTime: 1000 * 60 * 5,         // 5 minute: data is fresh for 1 minute
    gcTime: 1000 * 60 * 10,           // 10 minutes: unused cache removed after 10 mins
    refetchInterval: 1000 * 60 * 5,   // 5 minute: refetch every minute in background
  },
};