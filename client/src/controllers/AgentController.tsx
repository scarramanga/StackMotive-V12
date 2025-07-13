// Block 17 Implementation: AI Agent Controller stub
import React, { useState } from 'react';

// Block 17 Implementation: Props type
type AgentControllerProps = {
  assetSymbol: string;
  contextLabel: string;
  userPrefs: any;
  simulate?: boolean;
  onResponse?: (response: AgentResponse) => void;
};

// Block 17 Implementation: Agent response type
export type AgentResponse = {
  action: string;
  reason: string;
  confidence: number;
};

// Block 17 Implementation: Mock agent response generator
function getMockResponse(asset: string, context: string): AgentResponse {
  const actions = ['increase_weight', 'decrease_weight', 'hold', 'alert'];
  const reasons = [
    `${asset} narrative aligns with macro deflation signals.`,
    `${asset} shows technical overbought pattern.`,
    `${asset} whale activity detected in ${context}.`,
    `${asset} volatility spike, risk controls suggested.`,
  ];
  return {
    action: actions[Math.floor(Math.random() * actions.length)],
    reason: reasons[Math.floor(Math.random() * reasons.length)],
    confidence: +(Math.random() * 0.5 + 0.5).toFixed(2), // 0.5–1.0
  };
}

// Block 17 Implementation: Exported controller component
export const AgentController: React.FC<AgentControllerProps> = ({ assetSymbol, contextLabel, userPrefs, simulate = false, onResponse }) => {
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Block 17 Implementation: Simulate agent response
  const triggerAgent = () => {
    setLoading(true);
    if (simulate) {
      const delay = Math.random() * 1200 + 300; // 300–1500ms
      setTimeout(() => {
        const mock = getMockResponse(assetSymbol, contextLabel);
        setResponse(mock);
        setLoading(false);
        if (onResponse) onResponse(mock);
      }, delay);
    } else {
      // No real agent logic yet
      setResponse(null);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-muted/30">
      <div className="mb-2 font-semibold">Agent Controller (Stub)</div>
      <div className="mb-2 text-xs text-muted-foreground">Asset: {assetSymbol} | Context: {contextLabel}</div>
      <button
        className="btn btn-primary px-3 py-1 rounded bg-primary text-white"
        onClick={triggerAgent}
        disabled={loading}
      >
        {loading ? 'Thinking...' : 'Simulate Agent'}
      </button>
      {response && (
        <div className="mt-4 text-sm">
          <div><span className="font-bold">Action:</span> {response.action}</div>
          <div><span className="font-bold">Reason:</span> {response.reason}</div>
          <div><span className="font-bold">Confidence:</span> {response.confidence}</div>
        </div>
      )}
    </div>
  );
}; 