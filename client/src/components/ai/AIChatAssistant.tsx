import React, { useState } from 'react';
import { OverlayDocumentationPanel, useOverlayDocTooltip } from '../panels/OverlayDocumentationPanel';
// ...other imports

// Block 32: Overlay Documentation Panel (AI Chat Assistant integration)
export const AIChatAssistant: React.FC<{ overlays: any[] }> = ({ overlays }) => {
  const [docModal, setDocModal] = useState<string | null>(null);
  return (
    <div>
      {/* ...chat UI... */}
      <div className="flex flex-wrap gap-2 mt-2">
        {overlays.map((o: any) => (
          <span key={o.id} className="inline-flex items-center gap-1">
            <span>{o.name}</span>
            <button
              className="text-xs text-primary underline"
              title={useOverlayDocTooltip(o.id)}
              aria-label={`Show documentation for ${o.name}`}
              onClick={() => setDocModal(o.id)}
            >
              Info
            </button>
          </span>
        ))}
      </div>
      {docModal && (
        <OverlayDocumentationPanel modal initialOverlayId={docModal} onClose={() => setDocModal(null)} />
      )}
    </div>
  );
}; 