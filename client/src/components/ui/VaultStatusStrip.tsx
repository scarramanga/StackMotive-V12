import React from 'react';
import { usePortfolio } from '../../contexts/PortfolioContext';

interface VaultStatusStripProps {
  className?: string;
}

export const VaultStatusStrip: React.FC<VaultStatusStripProps> = ({ className }) => {
  const { activeVaultId, vaultList } = usePortfolio();

  // Find the active vault object
  const vault = vaultList.find(v => v.id === activeVaultId);
  const vaultName = vault?.name || 'No Vault';
  // Placeholder: lastUpdated and signalCount would come from vault or related API
  const lastUpdated = vault?.created_at ? new Date(vault.created_at).toLocaleString() : 'N/A';
  const signalCount = Array.isArray((vault as any)?.signals) ? (vault as any).signals.length : 0;

  return (
    <div
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted/60 dark:bg-muted/40 shadow-sm border border-border text-sm ${className || ''}`}
    >
      {/* Left: Vault Name */}
      <span className="font-bold truncate max-w-[40vw]" title={vaultName}>{vaultName}</span>
      {/* Center: Last Updated */}
      <span
        className="mx-2 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground focus:text-foreground cursor-pointer"
        tabIndex={0}
        title={lastUpdated}
      >
        Last Updated: {lastUpdated}
      </span>
      {/* Right: Signal Count */}
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
        {signalCount} Signals
      </span>
    </div>
  );
}; 