export type UserTier = 'observer' | 'navigator' | 'operator' | 'sovereign';

export const TIER_ORDER: UserTier[] = ['observer', 'navigator', 'operator', 'sovereign'];

export function tierMeetsRequirement(userTier: UserTier, requiredTier: UserTier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}

// Map of feature/component/route to minimum required tier
export const FEATURE_TIER_REQUIREMENTS: Record<string, UserTier> = {
  'ai-panel': 'navigator',
  'backtest': 'navigator',
  'signal-gpt': 'operator',
  'sovereign-dashboard': 'sovereign',
  // Add more as needed
}; 