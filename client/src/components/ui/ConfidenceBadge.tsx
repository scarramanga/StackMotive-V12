import React from 'react';

interface ConfidenceBadgeProps {
  score: number;
  rationale?: string;
}

const getBadgeColor = (score: number) => {
  if (score >= 80) return 'bg-green-500 text-white';
  if (score >= 60) return 'bg-yellow-400 text-yellow-900';
  if (score >= 40) return 'bg-orange-400 text-orange-900';
  return 'bg-red-500 text-white';
};

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score, rationale }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded font-bold text-xs cursor-pointer ${getBadgeColor(score)}`}
    title={rationale ? `Confidence: ${score}/100\n${rationale}` : `Confidence: ${score}/100`}
    aria-label={rationale ? `Confidence: ${score} out of 100. ${rationale}` : `Confidence: ${score} out of 100.`}
    tabIndex={0}
    role="status"
  >
    {score}
  </span>
); 