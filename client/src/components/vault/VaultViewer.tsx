// Block 30 Implementation: VaultViewer (Legacy Vault UX Layer)
import React, { useState } from 'react';
import { useVaultBeliefs } from '@/hooks/useVaultBeliefs';
import { Lock } from 'lucide-react';

// Block 30 Implementation: Mock category mapping
const BELIEF_CATEGORY: Record<string, 'thesis' | 'risk' | 'execution'> = {
  'btc-sov-store': 'thesis',
  'usd-debase': 'thesis',
  'demographic-deflation': 'risk',
  'ai-productivity': 'execution',
};

const CATEGORY_LABELS: Record<string, string> = {
  thesis: 'Core Thesis',
  risk: 'Risk Beliefs',
  execution: 'Execution Rules',
};

const CONFIDENCE_COLORS = [
  'bg-gray-300 text-gray-700', // 1-2
  'bg-yellow-200 text-yellow-800', // 3-4
  'bg-green-300 text-green-900', // 5
];

export const VaultViewer: React.FC = () => {
  const beliefs = useVaultBeliefs();
  // Group beliefs by category
  const grouped: Record<string, typeof beliefs> = {};
  beliefs.forEach(b => {
    const cat = BELIEF_CATEGORY[b.id] || 'thesis';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(b);
  });
  const [open, setOpen] = useState<Record<string, boolean>>({ thesis: true, risk: false, execution: false });

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
      <div className="font-bold text-lg mb-4">Vault Beliefs (Read-only)</div>
      {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
        <div key={cat} className="mb-4">
          <button
            className="w-full flex items-center justify-between py-2 px-3 bg-muted rounded hover:bg-muted/70 transition font-semibold text-left"
            onClick={() => setOpen(o => ({ ...o, [cat]: !o[cat] }))}
          >
            <span>{label}</span>
            <span className="text-xs text-muted-foreground">{open[cat] ? 'Hide' : 'Show'}</span>
          </button>
          {open[cat] && (
            <ul className="mt-2 space-y-2">
              {(grouped[cat] || []).map(belief => {
                const confIdx = belief.confidence >= 5 ? 2 : belief.confidence >= 3 ? 1 : 0;
                return (
                  <li
                    key={belief.id}
                    className={`flex items-center gap-3 p-3 rounded border bg-muted/30 ${CONFIDENCE_COLORS[confIdx]}`}
                  >
                    <span className="font-medium" title="This belief is enforced by VaultGuard.">{belief.statement}</span>
                    <span className="ml-auto flex items-center gap-1">
                      <span className="text-xs font-bold">{['Low', 'Medium', 'High'][confIdx]}</span>
                      <Lock className="w-4 h-4 text-gray-500" />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};
export default VaultViewer; 