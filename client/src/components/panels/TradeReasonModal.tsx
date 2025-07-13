import React, { useState, useEffect } from 'react';
import type { TradeReasonEntry } from '../../hooks/useTradeReasonRecorder';

interface TradeReasonModalProps {
  open: boolean;
  entry: TradeReasonEntry | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

const TradeReasonModal: React.FC<TradeReasonModalProps> = ({ open, entry, onConfirm, onCancel }) => {
  const [reason, setReason] = useState(entry?.reason || '');
  useEffect(() => {
    setReason(entry?.reason || '');
  }, [entry]);
  if (!open || !entry) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
        <h2 className="text-lg font-bold mb-2">Trade Reason Recorder</h2>
        <div className="mb-2 text-sm text-muted-foreground">
          <div><strong>Asset:</strong> {entry.asset}</div>
          <div><strong>Action:</strong> {entry.action}</div>
          <div><strong>Overlays:</strong> {entry.context.overlays.join(', ')}</div>
        </div>
        <div className="mb-2 text-xs text-muted-foreground">
          <strong>Agent Context:</strong>
          <pre className="bg-muted rounded p-2 mt-1 overflow-x-auto max-h-32">{JSON.stringify(entry.context.agentSignals, null, 2)}</pre>
        </div>
        <textarea
          className="w-full border rounded p-2 mb-4"
          rows={3}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Describe your reasoning for this trade..."
        />
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary px-4 py-2 rounded" onClick={onCancel}>Cancel</button>
          <button className="btn-primary px-4 py-2 rounded" onClick={() => onConfirm(reason)} disabled={!reason.trim()}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default TradeReasonModal; 