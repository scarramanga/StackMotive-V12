import { useQuery } from '@tanstack/react-query';

export interface AssetAllocation {
  percentage: number;
  role: string;
}

export function useAssetAllocation(symbol: string) {
  const { data: allocation, isLoading, error } = useQuery<AssetAllocation>({
    queryKey: ['/api/allocation', symbol],
    queryFn: async () => {
      const res = await fetch(`/api/allocation?asset=${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error('Failed to fetch allocation');
      return res.json();
    },
    enabled: !!symbol,
  });
  return { allocation, loading: isLoading, error };
} 