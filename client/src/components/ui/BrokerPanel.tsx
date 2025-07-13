// Block 78 Implementation
import React, { useEffect, useState } from 'react';
import { useBrokerAPI } from '../../hooks/useBrokerAPI';
import { usePortfolio } from '../../contexts/PortfolioContext';

interface Broker {
  broker_name: string;
  credentials: Record<string, any>;
  created_at?: string;
}

const BrokerPanel: React.FC = () => {
  // Block 78 Implementation
  const { getBrokersForSessionVault } = useBrokerAPI();
  const { activeVaultId } = usePortfolio();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      if (typeof window === 'undefined' || !activeVaultId) {
        setBrokers([]);
        setLoading(false);
        return;
      }
      const data = await getBrokersForSessionVault();
      if (!ignore) setBrokers(data);
      setLoading(false);
    }
    load();
    return () => { ignore = true; };
  }, [getBrokersForSessionVault, activeVaultId]);

  if (typeof window === 'undefined' || !activeVaultId) return null;

  return (
    <section className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg mt-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Connected Brokers</h2>
      {loading ? (
        <div className="text-gray-500">Loading brokers...</div>
      ) : brokers.length === 0 ? (
        <div className="text-gray-400 py-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <span className="block text-3xl mb-2">🔌</span>
          <span>No brokers connected for this Vault.</span>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {brokers.map((broker, idx) => (
            <li key={broker.broker_name + idx} className="py-4 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800 dark:text-gray-100">{broker.broker_name}</span>
                {broker.created_at && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {new Date(broker.created_at).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300">
                Type: {broker.credentials?.type || 'N/A'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default BrokerPanel; 