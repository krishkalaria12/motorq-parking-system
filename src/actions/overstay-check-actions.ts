import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { ActiveSession } from './parking-actions';

type OverstayCheckData = ActiveSession[];

async function checkForOverstays(): Promise<OverstayCheckData> {
  const response = await axiosInstance.get('/parking/overstay-check');
  return response.data.data;
}

export function useOverstayCheckQuery() {
  return useQuery({
    queryKey: ['overstayCheck'],
    queryFn: checkForOverstays,
    refetchInterval: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}