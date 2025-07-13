import React, { useState } from 'react';
import { overlayDocs, OverlayDoc } from '../../registry/overlayDocs';
import { useSentimentOverlay } from '../../hooks/useSentimentOverlay';

// Block 32: Overlay Documentation Panel (enhanced)
export function useOverlayDocTooltip(overlayId: string) {
  const doc = overlayDocs.find(d => d.id === overlayId);
  return doc ? `${doc.name}: ${doc.logic}` : '';
}

export const OverlayDocumentationPanel: React.FC<{ modal?: boolean; initialOverlayId?: string; onClose?: () => void }> = ({ modal = false, initialOverlayId, onClose }) => {
  const [expanded, setExpanded] = useState<string | null>(initialOverlayId || null);
  const [backtestSummaries, setBacktestSummaries] = useState<Record<string, string>>({});

  // Dynamically fetch backtest summaries for overlays with backtestResultId
  React.useEffect(() => {
    overlayDocs.forEach(doc => {
      if (doc.backtestResultId && !backtestSummaries[doc.backtestResultId]) {
        fetch(`/api/backtest/summary/${doc.backtestResultId}`)
          .then(res => res.ok ? res.text() : '')
          .then(summary => setBacktestSummaries(prev => ({ ...prev, [doc.backtestResultId!]: summary })))
          .catch(() => {});
      }
    });
    // eslint-disable-next-line
  }, []);

  const { refinedSentiment, logs } = useSentimentOverlay({ symbol: overlay.symbol, overlays: [overlay.id] });

  const content = (
    <section className={`rounded-xl bg-card dark:bg-card/80 p-4 shadow-lg border border-border max-w-2xl mx-auto my-6 transition-colors ${modal ? 'fixed inset-0 z-50 bg-black/40 flex items-center justify-center' : ''}`}>
      <h2 className="text-lg font-semibold mb-2">Overlay Documentation</h2>
      <div className="flex flex-col gap-3">
        {overlayDocs.map((doc: OverlayDoc) => (
          <div key={doc.id} className="border rounded bg-muted/40">
            <button
              className="w-full flex items-center justify-between px-4 py-2 text-left font-semibold text-primary focus:outline-none"
              onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}
              aria-expanded={expanded === doc.id}
              aria-controls={`overlay-doc-${doc.id}`}
              title={doc.logic}
            >
              <span>{doc.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{expanded === doc.id ? '▲' : '▼'}</span>
            </button>
            {expanded === doc.id && (
              <div id={`overlay-doc-${doc.id}`} className="px-4 pb-3 text-sm">
                <div className="mb-2"><span className="font-bold">Logic:</span> {doc.logic}</div>
                <div className="mb-2"><span className="font-bold">Inputs:</span> {doc.inputs.join(', ')}</div>
                <div className="mb-2"><span className="font-bold">Outputs:</span> {doc.outputs.join(', ')}</div>
                <div className="mb-2"><span className="font-bold">Glossary:</span> {doc.glossary.join('; ')}</div>
                <div className="mb-2"><span className="font-bold">Notes:</span> {doc.notes}</div>
                {doc.backtestResultId && (
                  <div className="mt-2">
                    <a
                      href={`/backtest/results/${doc.backtestResultId}`}
                      className="text-xs underline text-primary hover:text-primary/80 mr-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Backtest Results
                    </a>
                    <span className="text-xs text-muted-foreground">{backtestSummaries[doc.backtestResultId] || 'Loading summary...'}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {modal && (
        <button className="mt-4 px-4 py-2 rounded bg-primary text-white font-semibold" onClick={onClose} aria-label="Close overlay documentation">Close</button>
      )}
    </section>
  );
  if (modal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" role="dialog" aria-modal="true">
        {content}
      </div>
    );
  }
  return content;
}; 