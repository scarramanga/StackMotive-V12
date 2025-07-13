import React from 'react';
import { useVaultBeliefs } from '@/hooks/useVaultBeliefs';
import { Shield, AlertTriangle } from 'lucide-react';

interface VaultGuardProps {
  assetSymbol: string;
  contextLabel?: string;
}

// Block 26 Implementation: Simple asset-to-belief mapping for demo
const ASSET_BELIEF_MAP: Record<string, string[]> = {
  BTC: ['btc-sov-store'],
  USD: ['usd-debase'],
  NVDA: ['ai-productivity'],
  AI: ['ai-productivity'],
};

export const VaultGuard: React.FC<VaultGuardProps> = ({ assetSymbol }) => {
  const beliefs = useVaultBeliefs();
  const relevant = beliefs.filter(b => (ASSET_BELIEF_MAP[assetSymbol] || []).includes(b.id));

  if (!relevant.length) return null;

  return (
    <div className="flex gap-1 items-center ml-2">
      {relevant.map(belief => (
        <span key={belief.id} className="flex items-center gap-1" title={belief.statement}>
          {belief.confidence >= 4 ? (
            <Shield className="w-4 h-4 text-green-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          )}
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {belief.statement}
          </span>
        </span>
      ))}
    </div>
  );
};
export default VaultGuard; 