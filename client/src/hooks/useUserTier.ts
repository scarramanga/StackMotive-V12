import { useUserSubscription } from './useUserSubscription';
import type { UserTier } from '../utils/tier';

export function useUserTier(): UserTier {
  const { tier } = useUserSubscription();
  // Normalize to canonical tier names
  if (tier === 'sovereign') return 'sovereign';
  if (tier === 'operator') return 'operator';
  if (tier === 'navigator') return 'navigator';
  return 'observer';
} 