// Block 31 Implementation: VaultImport UI
import React, { useState } from 'react';
import { useImportVault } from '@/hooks/useImportVault';
import VaultHashDisplay from './VaultHashDisplay';

export const VaultImport: React.FC = () => {
  const { imported, error, importFromJSON, importFromHash } = useImportVault();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'json' | 'hash'>('json');
  const [confirmed, setConfirmed] = useState(false);

  function handleImport() {
    if (mode === 'json') importFromJSON(input);
    else importFromHash(input);
  }

  function handleConfirm() {
    setConfirmed(true);
    // Block 31 Implementation: No real persistence
    // eslint-disable-next-line no-console
    console.log('Vault imported:', imported);
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
      <div className="font-bold text-lg mb-4">Import Vault (Read-only)</div>
      <div className="flex gap-2 mb-4">
        <button className={`px-3 py-1 rounded ${mode === 'json' ? 'bg-primary text-white' : 'bg-muted'}`} onClick={() => setMode('json')}>Paste JSON</button>
        <button className={`px-3 py-1 rounded ${mode === 'hash' ? 'bg-primary text-white' : 'bg-muted'}`} onClick={() => setMode('hash')}>From Hash</button>
      </div>
      <textarea
        className="w-full p-2 rounded border mb-2 bg-muted"
        rows={3}
        placeholder={mode === 'json' ? 'Paste Vault JSON here...' : 'Enter Vault hash...'}
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <button className="w-full bg-blue-600 text-white py-2 rounded font-semibold mb-2" onClick={handleImport}>Import</button>
      {error && <div className="text-red-600 text-xs mb-2">{error}</div>}
      {imported && (
        <div className="mt-4">
          <div className="font-semibold mb-2">Vault Preview</div>
          <ul className="space-y-2 mb-2">
            {imported.map((b: any) => (
              <li key={b.id} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                <span className="font-medium">{b.statement}</span>
                <span className="ml-auto text-xs text-gray-500">Confidence: {b.confidence}</span>
              </li>
            ))}
          </ul>
          <VaultHashDisplay beliefs={imported} />
          {!confirmed && <button className="mt-4 w-full bg-green-600 text-white py-2 rounded font-semibold" onClick={handleConfirm}>Confirm Import</button>}
          {confirmed && <div className="text-green-700 font-semibold mt-2">Vault imported (mock only)</div>}
        </div>
      )}
    </div>
  );
};
export default VaultImport; 