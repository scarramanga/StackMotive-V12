import React, { useState } from 'react';
import { useBrokerCredentialSession } from '../../hooks/useBrokerCredentialSession';

const BROKER_FIELDS = {
  kucoin: [
    { name: 'apiKey', label: 'API Key', type: 'text' },
    { name: 'apiSecret', label: 'API Secret', type: 'password' },
  ],
  kraken: [
    { name: 'apiKey', label: 'API Key', type: 'text' },
    { name: 'privateKey', label: 'Private Key', type: 'password' },
  ],
  easyCrypto: [
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'apiToken', label: 'API Token', type: 'password' },
  ],
  ibkr: [],
  sharesies: [],
};

const BROKER_LABELS = {
  kucoin: 'KuCoin',
  kraken: 'Kraken',
  easyCrypto: 'EasyCrypto',
  ibkr: 'IBKR',
  sharesies: 'Sharesies (CSV Upload)',
};

type Broker = keyof typeof BROKER_FIELDS;

interface BrokerCredentialsModalProps {
  isOpen: boolean;
  broker: Broker;
  onClose: () => void;
  onSubmit: (broker: Broker, creds: any) => void;
}

const BrokerCredentialsModal: React.FC<BrokerCredentialsModalProps> = ({ isOpen, broker, onClose, onSubmit }) => {
  const { setCredentials, clearCredentials } = useBrokerCredentialSession();
  const [fields, setFields] = useState<any>({});
  const [csvFile, setCsvFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvFile(e.target.files?.[0] || null);
  };

  const handleConnect = () => {
    let creds: any = {};
    if (broker === 'sharesies') {
      creds = { csv: csvFile };
    } else if (broker === 'ibkr') {
      creds = { oauth: true };
    } else {
      creds = fields;
    }
    setCredentials(broker, creds);
    // Block 46 Implementation: Only log, never persist
    // eslint-disable-next-line no-console
    console.log(`[Block 46] Credentials for ${broker}:`, creds);
    onSubmit(broker, creds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={() => { clearCredentials(broker); onClose(); }}
          aria-label="Close"
        >
          ×
        </button>
        <div className="mb-4 text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900 rounded p-3 font-medium">
          Credentials are never stored. This app does not retain or transmit any API keys.
        </div>
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">{BROKER_LABELS[broker]} Credentials</h2>
        {broker === 'ibkr' && (
          <button
            className="w-full bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 mb-4"
            onClick={handleConnect}
          >
            Connect with IBKR OAuth (Stub)
          </button>
        )}
        {broker === 'sharesies' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">CSV Upload</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvChange}
              className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <div className="text-xs text-gray-500 mt-1">No API key required. CSV is never uploaded or stored.</div>
          </div>
        )}
        {BROKER_FIELDS[broker].length > 0 && (
          <form
            className="space-y-4"
            onSubmit={e => { e.preventDefault(); handleConnect(); }}
          >
            {BROKER_FIELDS[broker].map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium mb-1">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={fields[field.name] || ''}
                  onChange={handleFieldChange}
                  className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  autoComplete="off"
                />
              </div>
            ))}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 mt-2"
            >
              Connect
            </button>
          </form>
        )}
        {broker === 'sharesies' && (
          <button
            className="w-full bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 mt-4"
            onClick={handleConnect}
            disabled={!csvFile}
          >
            Import CSV
          </button>
        )}
      </div>
    </div>
  );
};

export default BrokerCredentialsModal; 