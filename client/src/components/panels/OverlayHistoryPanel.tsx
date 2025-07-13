import React, { useMemo, useState } from 'react';
import { useRebalanceScheduler } from '../../hooks/useRebalanceScheduler';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { RebalanceHistoryEntry } from '../../types/rebalance';

const OverlayHistoryPanel: React.FC = () => {
  const { history } = useRebalanceScheduler({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');

  // Filtered and sorted history
  const filteredHistory = useMemo(() => {
    let entries = history;
    if (dateFilter) {
      entries = entries.filter(e => e.timestamp.startsWith(dateFilter));
    }
    return [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [history, dateFilter]);

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Overlay History</h2>
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="date-filter" className="text-sm font-medium">Filter by date:</label>
        <input
          id="date-filter"
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
        <button
          className="ml-2 text-xs text-muted-foreground underline"
          onClick={() => setDateFilter('')}
          disabled={!dateFilter}
        >
          Clear
        </button>
      </div>
      <div className="space-y-2">
        {filteredHistory.length === 0 && (
          <div className="text-muted-foreground text-sm">No overlay history found for the selected date.</div>
        )}
        {filteredHistory.map(entry => {
          const isOpen = expanded === entry.id;
          return (
            <div key={entry.id} className="bg-card rounded shadow p-3">
              <button
                className="w-full flex items-center justify-between text-left focus:outline-none"
                onClick={() => setExpanded(isOpen ? null : entry.id)}
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-base">
                  {format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm')}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{Object.keys(entry.afterWeights).length} assets</span>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>
              {isOpen && (
                <div className="mt-3 space-y-2">
                  <div className="flex flex-col md:flex-row md:gap-8">
                    <div className="flex-1">
                      <div className="font-medium mb-1">Allocation Change</div>
                      <table className="w-full text-sm border rounded">
                        <thead>
                          <tr>
                            <th className="text-left">Asset</th>
                            <th className="text-right">Before</th>
                            <th className="text-right">After</th>
                            <th className="text-right">Delta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(entry.afterWeights).map(asset => {
                            const before = entry.beforeWeights[asset] ?? 0;
                            const after = entry.afterWeights[asset] ?? 0;
                            const delta = after - before;
                            return (
                              <tr key={asset}>
                                <td>{asset}</td>
                                <td className="text-right">{(before * 100).toFixed(2)}%</td>
                                <td className="text-right">{(after * 100).toFixed(2)}%</td>
                                <td className={`text-right ${delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>{delta > 0 ? '+' : ''}{(delta * 100).toFixed(2)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex-1 mt-4 md:mt-0">
                      <div className="font-medium mb-1 flex items-center gap-1">
                        Rationale
                        <span className="relative group">
                          <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                          <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-background border rounded shadow text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                            {entry.rationale}
                          </span>
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-4">{entry.rationale}</div>
                      <div className="mt-2 flex gap-2 text-xs">
                        <span className={`px-2 py-1 rounded ${entry.confirmed ? 'bg-green-100 text-green-700' : entry.skipped ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{entry.confirmed ? 'Confirmed' : entry.skipped ? 'Skipped' : 'Pending'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OverlayHistoryPanel; 