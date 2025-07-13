import React, { useState } from 'react';
import { OverlayDocumentationPanel, useOverlayDocTooltip } from '../panels/OverlayDocumentationPanel';
// ...other imports

// Block 32: Overlay Documentation Panel (strategy dashboard integration)
export const StrategyDashboard: React.FC<{ overlays: any[] }> = ({ overlays }) => {
  const [docModal, setDocModal] = useState<string | null>(null);
  return (
    <div>
      {/* ...other dashboard content... */}
      <div className="flex flex-col gap-2">
        {overlays.map((o: any) => (
          <div key={o.id} className="flex items-center gap-2">
            <span>{o.name}</span>
            <button
              className="text-xs text-primary underline"
              title={useOverlayDocTooltip(o.id)}
              aria-label={`Show documentation for ${o.name}`}
              onClick={() => setDocModal(o.id)}
            >
              Info
            </button>
          </div>
        ))}
      </div>
      {docModal && (
        <OverlayDocumentationPanel modal initialOverlayId={docModal} onClose={() => setDocModal(null)} />
      )}
    </div>
  );
}; 