import React from 'react';

interface ProvenanceTagProps {
  source: 'gpt' | 'broker' | 'user';
  confidence?: number;
  timestamp?: string;
  contextNote?: string;
}

const SOURCE_STYLES: Record<string, string> = {
  gpt: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  broker: 'bg-blue-100 text-blue-700 border-blue-300',
  user: 'bg-green-100 text-green-700 border-green-300',
};

const SOURCE_LABELS: Record<string, string> = {
  gpt: 'AI (GPT)',
  broker: 'Broker',
  user: 'User',
};

export const ProvenanceTag: React.FC<ProvenanceTagProps> = ({ source, confidence, timestamp, contextNote }) => {
  const tooltip = [
    timestamp ? `Time: ${timestamp}` : null,
    contextNote ? `Note: ${contextNote}` : null,
    confidence !== undefined ? `Confidence: ${(confidence * 100).toFixed(0)}%` : null,
  ].filter(Boolean).join(' | ');

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${SOURCE_STYLES[source]}`}
      title={tooltip}
    >
      {SOURCE_LABELS[source]}
      {confidence !== undefined && (
        <span className="ml-1 opacity-70">({(confidence * 100).toFixed(0)}%)</span>
      )}
    </span>
  );
};
export default ProvenanceTag; 