import React, { useState } from 'react';

// Mock event data structure
interface OrchestrationEvent {
  timestamp: string;
  signalSource: string;
  signalType: string;
  gptRecommendation: string;
  vaultResult: { valid: boolean; reason?: string };
  finalDecision: 'accepted' | 'rejected' | 'warning';
  decisionReason?: string;
}

const MOCK_EVENTS: OrchestrationEvent[] = [
  {
    timestamp: '2025-06-03 10:01:12',
    signalSource: 'StrategyEngine',
    signalType: 'Buy BTC',
    gptRecommendation: 'Proceed: Market momentum positive',
    vaultResult: { valid: false, reason: 'Vault prohibits shorting BTC (core thesis: sovereign store-of-value).' },
    finalDecision: 'rejected',
    decisionReason: 'VaultGuard: Belief violation',
  },
  {
    timestamp: '2025-06-03 10:02:45',
    signalSource: 'SignalOverlay',
    signalType: 'Sell ETH',
    gptRecommendation: 'Caution: High volatility',
    vaultResult: { valid: true },
    finalDecision: 'accepted',
  },
  {
    timestamp: '2025-06-03 10:03:30',
    signalSource: 'GPTAdvisor',
    signalType: 'Buy USD',
    gptRecommendation: 'Warn: USD debasement risk',
    vaultResult: { valid: false, reason: 'Vault prohibits buying USD (core thesis: USD debasement).' },
    finalDecision: 'rejected',
    decisionReason: 'VaultGuard: Belief violation',
  },
  {
    timestamp: '2025-06-03 10:04:10',
    signalSource: 'StrategyEngine',
    signalType: 'Buy SOL',
    gptRecommendation: 'Proceed: Technical breakout',
    vaultResult: { valid: true },
    finalDecision: 'accepted',
  },
  {
    timestamp: '2025-06-03 10:05:00',
    signalSource: 'SignalOverlay',
    signalType: 'Buy BTC',
    gptRecommendation: 'Warn: Allocation exceeds risk threshold',
    vaultResult: { valid: false, reason: 'Vault risk rule: allocation exceeds allowed maximum.' },
    finalDecision: 'warning',
    decisionReason: 'Allocation flagged by VaultGuard',
  },
];

const statusColor = {
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
};

const OrchestrationLog: React.FC = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return (
      <button
        className="mt-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
        onClick={() => setVisible(true)}
      >
        Show Orchestration Log
      </button>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto my-4 p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold">Orchestration Trace Log</h2>
        <button
          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-xs"
          onClick={() => setVisible(false)}
        >
          Hide
        </button>
      </div>
      <ol className="relative border-l border-gray-300">
        {MOCK_EVENTS.map((event, idx) => (
          <li key={idx} className="mb-8 ml-4">
            <div className="absolute w-3 h-3 bg-blue-400 rounded-full -left-1.5 border border-white"></div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500">{event.timestamp}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColor[event.finalDecision]}`}>{event.finalDecision.toUpperCase()}</span>
            </div>
            <div className="text-sm">
              <div><span className="font-semibold">Source:</span> {event.signalSource}</div>
              <div><span className="font-semibold">Signal:</span> {event.signalType}</div>
              <div><span className="font-semibold">GPT:</span> {event.gptRecommendation}</div>
              <div>
                <span className="font-semibold">VaultGuard:</span> {event.vaultResult.valid ? <span className="text-green-700">Pass</span> : <span className="text-red-700">{event.vaultResult.reason || 'Rejected'}</span>}
              </div>
              {event.decisionReason && (
                <div><span className="font-semibold">Reason:</span> {event.decisionReason}</div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default OrchestrationLog; 