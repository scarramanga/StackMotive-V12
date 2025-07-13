import React from 'react';
import { IntegrityAlert } from '../../hooks/usePortfolioIntegrity';

const SEVERITY_COLORS = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const IntegrityScanReport: React.FC<{ alerts: IntegrityAlert[] }> = ({ alerts }) => {
  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Portfolio Integrity Scan</h2>
      <table className="w-full text-sm border mb-4">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="p-1 text-left">Asset</th>
            <th className="p-1">Issue</th>
            <th className="p-1">Severity</th>
            <th className="p-1">Action</th>
          </tr>
        </thead>
        <tbody>
          {alerts.length === 0 && (
            <tr><td colSpan={4} className="p-4 text-center text-gray-400">No issues detected.</td></tr>
          )}
          {alerts.map((a, i) => (
            <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
              <td className="p-1 font-mono">{a.asset}</td>
              <td className="p-1">{a.message}</td>
              <td className="p-1">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${SEVERITY_COLORS[a.severity]}`}>{a.severity.toUpperCase()}</span>
              </td>
              <td className="p-1">
                <button
                  className="px-2 py-1 rounded bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
                  onClick={() => alert('Show recommendations (mock)')}
                >
                  View Recommendations
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default IntegrityScanReport; 