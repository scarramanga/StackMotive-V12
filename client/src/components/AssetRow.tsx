import React from 'react';
import { calculateTrustScore, Asset } from '../utils/calculateTrustScore';

// Block 29: Asset Trust Score Badge
export const AssetRow: React.FC<{ asset: Asset }> = ({ asset }) => {
  const trust = calculateTrustScore(asset);
  const badgeColor = trust.score < 2 ? 'bg-red-500 text-white' : trust.score < 4 ? 'bg-yellow-400 text-yellow-900' : 'bg-green-500 text-white';
  const rowHighlight = trust.score < 2 ? 'bg-red-50 dark:bg-red-900/20' : '';

  // Optionally log signal trigger if threshold is crossed (side effect)
  React.useEffect(() => {
    if (trust.score < 2) {
      // TODO: Log signal trigger for low trust score
    }
  }, [trust.score]);

  return (
    <tr className={`transition-colors ${rowHighlight}`}>
      <td className="px-2 py-1 font-mono text-xs">{asset.symbol}</td>
      <td className="px-2 py-1">{asset.name}</td>
      <td className="px-2 py-1">
        <span
          className={`inline-block px-2 py-0.5 rounded font-bold text-xs cursor-pointer ${badgeColor}`}
          title={`Trust Score: ${trust.score}/5\n${trust.rationale}\nTechnical: ${trust.breakdown.technical}, On-chain: ${trust.breakdown.onChain}, Sentiment: ${trust.breakdown.sentiment}`}
          aria-label={`Trust Score: ${trust.score} out of 5. Hover for breakdown.`}
        >
          {trust.score}
        </span>
      </td>
      {/* Add more columns as needed */}
    </tr>
  );
}; 