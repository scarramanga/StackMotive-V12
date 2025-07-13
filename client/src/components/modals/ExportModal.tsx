import React, { useState } from 'react';
import { exportArchive } from '../../utils/ExportEngine';

const SCOPE_OPTIONS = [
  { value: 'vault', label: 'Vault Only' },
  { value: 'journal', label: 'Journal Only' },
  { value: 'portfolio', label: 'Portfolio Only' },
  { value: 'all', label: 'All (Recommended)' },
];

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultBeliefs: any[];
  journalLogs: any[];
  portfolioState: any;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, vaultBeliefs, journalLogs, portfolioState }) => {
  const [scope, setScope] = useState<'vault'|'journal'|'portfolio'|'all'>('all');
  const [status, setStatus] = useState<'idle'|'success'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    setStatus('idle');
    setErrorMsg('');
    const result = await exportArchive({ vaultBeliefs, journalLogs, portfolioState, scope });
    setLoading(false);
    if (result.success) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMsg(result.error || 'Export failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4">Export & Archive</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Export Scope</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={scope}
            onChange={e => setScope(e.target.value as any)}
            disabled={loading}
          >
            {SCOPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-60"
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? 'Exporting...' : 'Export Now'}
        </button>
        {status === 'success' && (
          <div className="mt-4 text-green-700 text-sm font-medium">Export complete! Check your downloads.</div>
        )}
        {status === 'error' && (
          <div className="mt-4 text-red-700 text-sm font-medium">{errorMsg}</div>
        )}
      </div>
    </div>
  );
};

export default ExportModal; 