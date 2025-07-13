import React, { useState } from 'react';

// Mock frozen Vault beliefs
const FROZEN_VAULT_BELIEFS = [
  { id: 'btc-sov-store', statement: 'BTC is the ultimate sovereign store of value.', confidence: 5 },
  { id: 'usd-debase', statement: 'The USD will structurally debase over time.', confidence: 4 },
  { id: 'risk-allocation', statement: 'Always respect risk allocation discipline.', confidence: 5 },
];

const TONE_OPTIONS = [
  { value: 'calm', label: 'Calm' },
  { value: 'assertive', label: 'Assertive' },
  { value: 'reflective', label: 'Reflective' },
];

function generateLegacyMessage(tone: string) {
  // Mocked GPT message based on tone
  switch (tone) {
    case 'assertive':
      return `If I'm gone, follow these convictions without compromise. BTC is your anchor. Never trust fiat blindly. Risk discipline is your shield.`;
    case 'reflective':
      return `If I'm gone, remember: these beliefs were forged through experience. BTC endures, fiat fades, and discipline preserves legacy. Reflect, adapt, but honor these lessons.`;
    case 'calm':
    default:
      return `If I'm gone, follow these convictions. BTC is a safe haven. Fiat will erode. Stay disciplined, and you'll endure any storm.`;
  }
}

const DadGPTOverlay: React.FC = () => {
  const [tone, setTone] = useState<'calm'|'assertive'|'reflective'>('calm');
  const [exported, setExported] = useState(false);
  const timestamp = new Date().toLocaleString();

  const handleExport = () => {
    // Simulate export (no backend)
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative" style={{ boxShadow: '0 8px 32px rgba(60,60,60,0.18)' }}>
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={() => window.history.back()}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-extrabold mb-2 text-center text-gray-800" style={{ fontFamily: 'serif' }}>DadGPT Legacy Overlay</h2>
        <div className="text-center text-gray-500 mb-6 text-sm">{timestamp}</div>
        <div className="mb-6">
          <div className="mb-2 text-lg font-semibold text-gray-700">Frozen Vault Convictions</div>
          <ul className="mb-2 space-y-1">
            {FROZEN_VAULT_BELIEFS.map(b => (
              <li key={b.id} className="text-gray-700 flex items-center gap-2">
                <span className="italic">{b.statement}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">Confidence: {b.confidence}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Tone</label>
          <select
            className="w-full border rounded px-3 py-2 bg-gray-50"
            value={tone}
            onChange={e => setTone(e.target.value as any)}
          >
            {TONE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="mb-6 p-4 rounded-lg bg-gray-50 shadow-inner text-lg text-gray-800" style={{ fontFamily: 'serif', minHeight: 80 }}>
          {generateLegacyMessage(tone)}
        </div>
        <button
          className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
          onClick={handleExport}
        >
          Export as PDF / Text (Simulated)
        </button>
        {exported && (
          <div className="mt-3 text-green-700 text-center text-sm font-medium">Export simulated! (No file actually saved)</div>
        )}
        <div className="mt-6 text-center text-xs text-gray-400">For Sovereign Tier & legacy use only. No real GPT or Vault editing.</div>
      </div>
    </div>
  );
};

export default DadGPTOverlay; 