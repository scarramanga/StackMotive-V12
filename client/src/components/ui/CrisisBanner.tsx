// Block 16 Implementation: CrisisBanner component
import React from 'react';
import { useCrisisMode } from '@/hooks/useCrisisMode';

export const CrisisBanner: React.FC = () => {
  const { crisis } = useCrisisMode();
  if (!crisis) return null;
  return (
    <div className="w-full bg-red-600 text-white text-center py-2 px-4 font-bold shadow z-[200] fixed top-0 left-0">
      Crisis Mode: Volatility detected. Safe Mode activated.
    </div>
  );
}; 