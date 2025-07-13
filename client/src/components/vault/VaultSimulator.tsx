import React, { useState } from 'react';

const NARRATIVES = [
  {
    key: 'hyperinflation',
    label: 'Hyperinflation',
    effect: (strength: number) => ({
      beliefs: [
        { id: 'usd-debase', statement: 'Structural USD debasement', confidence: Math.min(5, 3 + strength) },
        { id: 'btc-sov-store', statement: 'BTC as sovereign store-of-value', confidence: Math.min(5, 4 + Math.floor(strength / 2)) },
        { id: 'risk-allocation', statement: 'Risk allocation discipline', confidence: 3 },
      ],
      gptOverlay: 'Increase BTC allocation, reduce USD exposure.'
    })
  },
  {
    key: 'rate-hike-pause',
    label: 'Rate Hike Pause',
    effect: (strength: number) => ({
      beliefs: [
        { id: 'usd-debase', statement: 'Structural USD debasement', confidence: 2 },
        { id: 'btc-sov-store', statement: 'BTC as sovereign store-of-value', confidence: 3 },
        { id: 'risk-allocation', statement: 'Risk allocation discipline', confidence: 4 },
      ],
      gptOverlay: 'Consider moderate risk-on positioning.'
    })
  },
  {
    key: 'ai-boom',
    label: 'AI Boom',
    effect: (strength: number) => ({
      beliefs: [
        { id: 'usd-debase', statement: 'Structural USD debasement', confidence: 2 },
        { id: 'btc-sov-store', statement: 'BTC as sovereign store-of-value', confidence: 3 },
        { id: 'risk-allocation', statement: 'Risk allocation discipline', confidence: 4 },
        { id: 'ai-growth', statement: 'AI sector outperformance', confidence: Math.min(5, 3 + strength) },
      ],
      gptOverlay: 'Increase allocation to AI equities and tech.'
    })
  },
  {
    key: 'btc-ban',
    label: 'BTC Ban',
    effect: (strength: number) => ({
      beliefs: [
        { id: 'usd-debase', statement: 'Structural USD debasement', confidence: 2 },
        { id: 'btc-sov-store', statement: 'BTC as sovereign store-of-value', confidence: Math.max(1, 3 - strength) },
        { id: 'risk-allocation', statement: 'Risk allocation discipline', confidence: 5 },
      ],
      gptOverlay: 'Reduce BTC exposure, seek alternative stores of value.'
    })
  },
];

const MOCK_VAULT_BEFORE = [
  { id: 'usd-debase', statement: 'Structural USD debasement', confidence: 3 },
  { id: 'btc-sov-store', statement: 'BTC as sovereign store-of-value', confidence: 4 },
  { id: 'risk-allocation', statement: 'Risk allocation discipline', confidence: 3 },
];

const VaultSimulator: React.FC = () => {
  const [narrative, setNarrative] = useState(NARRATIVES[0].key);
  const [strength, setStrength] = useState(2);

  const narrativeObj = NARRATIVES.find(n => n.key === narrative)!;
  const after = narrativeObj.effect(strength);

  // Helper to find before/after confidence
  const getBefore = (id: string) => MOCK_VAULT_BEFORE.find(b => b.id === id)?.confidence ?? '-';
  const getAfter = (id: string) => after.beliefs.find(b => b.id === id)?.confidence ?? '-';
  const allIds = Array.from(new Set([
    ...MOCK_VAULT_BEFORE.map(b => b.id),
    ...after.beliefs.map(b => b.id)
  ]));

  return (
    <div className="bg-white rounded shadow p-6 max-w-2xl mx-auto my-6">
      <h2 className="text-xl font-bold mb-4">Narrative Vault Simulator</h2>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Select Narrative</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={narrative}
            onChange={e => setNarrative(e.target.value)}
          >
            {NARRATIVES.map(n => (
              <option key={n.key} value={n.key}>{n.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Narrative Strength</label>
          <input
            type="range"
            min={1}
            max={5}
            value={strength}
            onChange={e => setStrength(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-gray-500 mt-1">{strength}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Before</h3>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-1 text-left">Belief</th>
                <th className="p-1">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {allIds.map(id => (
                <tr key={id}>
                  <td className="p-1">{MOCK_VAULT_BEFORE.find(b => b.id === id)?.statement || after.beliefs.find(b => b.id === id)?.statement}</td>
                  <td className="p-1 text-center">{getBefore(id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="font-semibold mb-2">After</h3>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-1 text-left">Belief</th>
                <th className="p-1">Confidence</th>
                <th className="p-1">Δ</th>
              </tr>
            </thead>
            <tbody>
              {allIds.map(id => {
                const before = getBefore(id);
                const afterVal = getAfter(id);
                let delta: string | number = '-';
                if (typeof before === 'number' && typeof afterVal === 'number') {
                  delta = afterVal - before;
                }
                return (
                  <tr key={id}>
                    <td className="p-1">{MOCK_VAULT_BEFORE.find(b => b.id === id)?.statement || after.beliefs.find(b => b.id === id)?.statement}</td>
                    <td className="p-1 text-center">{afterVal}</td>
                    <td className={`p-1 text-center ${typeof delta === 'number' && delta > 0 ? 'text-green-600' : typeof delta === 'number' && delta < 0 ? 'text-red-600' : 'text-gray-500'}`}>{delta === '-' ? '-' : typeof delta === 'number' && delta > 0 ? `+${delta}` : delta}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <div className="font-semibold mb-1">GPT Overlay (Simulated):</div>
        <div className="text-sm text-blue-700">{after.gptOverlay}</div>
      </div>
    </div>
  );
};

export default VaultSimulator; 