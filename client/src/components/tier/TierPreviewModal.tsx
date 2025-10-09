import React, { useState } from 'react';
import { api } from '@/lib/api';

interface Props {
  currentTier: string;
  onClose: () => void;
  onStartPreview: () => void;
}

const TIER_INFO = {
  participant: { name: 'Participant', features: ['Advanced portfolio analytics', 'Trading signals', 'Rebalance tools'] },
  builder: { name: 'Builder', features: ['Custom strategies', 'API access', 'Advanced backtesting'] },
  sovereign: { name: 'Sovereign', features: ['All features', 'Priority support', 'Institutional data'] }
};

export function TierPreviewModal({ currentTier, onClose, onStartPreview }: Props) {
  const [selectedTier, setSelectedTier] = useState<string>('participant');
  const [loading, setLoading] = useState(false);

  const startPreview = async () => {
    setLoading(true);
    try {
      await api.post('/api/tier-preview/start', { target_tier: selectedTier });
      onStartPreview();
      onClose();
    } catch (error) {
      console.error('Failed to start preview:', error);
      alert('Failed to start preview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Try Premium Features</h2>
        <p className="text-gray-600 mb-6">
          Preview higher-tier features for 5 minutes. No commitment required.
        </p>

        <div className="space-y-3 mb-6">
          {Object.entries(TIER_INFO).map(([tier, info]) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`w-full text-left p-4 border-2 rounded-lg transition ${
                selectedTier === tier ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-lg mb-2">{info.name}</div>
              <ul className="text-sm text-gray-600 space-y-1">
                {info.features.map(feature => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={startPreview}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start 5-Minute Preview'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
