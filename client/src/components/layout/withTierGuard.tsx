import React from 'react';
import { useUserTier } from '../../hooks/useUserTier';
import { tierMeetsRequirement, UserTier } from '../../utils/tier';

interface WithTierGuardOptions {
  requiredTier: UserTier;
  upgradeMessage?: string;
}

export function withTierGuard<P>(
  WrappedComponent: React.ComponentType<P>,
  options: WithTierGuardOptions
) {
  const TierGuardedComponent: React.FC<P> = (props) => {
    const userTier = useUserTier();
    if (!tierMeetsRequirement(userTier, options.requiredTier)) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 text-lg font-semibold text-warning">{options.upgradeMessage || 'This feature requires a higher subscription tier.'}</div>
          <a
            href="/account-management#upgrade"
            className="inline-block px-4 py-2 rounded bg-primary text-white font-bold shadow hover:bg-primary/90 transition"
          >
            Upgrade Now
          </a>
        </div>
      );
    }
    return <WrappedComponent {...props} />;
  };
  return TierGuardedComponent;
} 