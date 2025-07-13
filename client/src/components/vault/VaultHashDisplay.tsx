import React from 'react';

interface VaultHashDisplayProps {
  beliefs: { id: string; statement: string; confidence: number }[];
}

// Block 31 Implementation: Mock hash generator (SHA256-style, not real)
function mockHash(beliefs: VaultHashDisplayProps['beliefs']): string {
  const str = beliefs.map(b => `${b.id}:${b.confidence}`).join('|');
  let hash = 0, i, chr;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return 'VAULT-' + Math.abs(hash).toString(16).padStart(8, '0');
}

export const VaultHashDisplay: React.FC<VaultHashDisplayProps> = ({ beliefs }) => {
  const hash = mockHash(beliefs);
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-xs font-mono bg-gray-200 dark:bg-neutral-800 px-2 py-1 rounded select-all">{hash}</span>
      <span className="text-xs text-gray-500">(Vault fingerprint)</span>
    </div>
  );
};
export default VaultHashDisplay; 