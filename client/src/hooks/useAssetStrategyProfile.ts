import { useQuery } from '@tanstack/react-query';

export interface AssetStrategyProfile {
  name: string;
  type: string;
  status: string;
}

export function useAssetStrategyProfile(symbol: string) {
  const { data: strategy, isLoading, error } = useQuery<AssetStrategyProfile>({
    queryKey: ['/api/strategy-profile', symbol],
    queryFn: async () => {
      const res = await fetch(`/api/strategy-profile?asset=${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error('Failed to fetch strategy profile');
      return res.json();
    },
    enabled: !!symbol,
  });
  return { strategy, loading: isLoading, error };
} 