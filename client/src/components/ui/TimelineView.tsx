import React from 'react';
import type { SignalLogEntry } from '../../store/signalLog';
import { TagInput } from './TagInput';
import { ProvenanceTag } from './ProvenanceTag';

interface TimelineViewProps {
  entries: SignalLogEntry[];
  expandedRows: Set<string>;
  onToggleRow: (id: string) => void;
  onTag: (id: string, tag: string) => void;
  onAnnotate: (id: string, note: string) => void;
  anomalyMap: Record<string, boolean>;
  search: string;
  timezone: string;
  locale: string;
  deepLink: (id: string) => string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  entries,
  expandedRows,
  onToggleRow,
  onTag,
  onAnnotate,
  anomalyMap,
  search,
  timezone,
  locale,
  deepLink,
}) => {
  // Group by day
  const grouped = entries.reduce((acc, entry) => {
    const day = new Date(entry.generatedAt).toLocaleDateString(locale, { timeZone: timezone });
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {} as Record<string, SignalLogEntry[]>);
  const days = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="timeline-view">
      {days.map(day => (
        <div key={day} className="mb-6">
          <div className="text-xs font-bold text-gray-500 mb-2">{day}</div>
          <ul className="space-y-2">
            {grouped[day].map(entry => {
              const expanded = expandedRows.has(entry.id);
              const highlight = anomalyMap[entry.id];
              const matchesSearch =
                !search ||
                entry.notes?.toLowerCase().includes(search.toLowerCase()) ||
                entry.technicalIndicators?.rationale?.toLowerCase().includes(search.toLowerCase()) ||
                entry.symbol.toLowerCase().includes(search.toLowerCase());
              if (!matchesSearch) return null;
              return (
                <li
                  key={entry.id}
                  className={`border rounded p-2 bg-white dark:bg-gray-900 shadow-sm ${highlight ? 'border-red-400' : ''}`}
                  aria-expanded={expanded}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleRow(entry.id)}
                      aria-label={expanded ? 'Collapse details' : 'Expand details'}
                      className="text-xs text-blue-600 underline focus:outline-none"
                    >
                      {expanded ? '-' : '+'}
                    </button>
                    <span className="font-semibold">{entry.symbol}</span>
                    <span className="text-xs text-gray-500">{new Date(entry.generatedAt).toLocaleTimeString(locale, { timeZone: timezone })}</span>
                    <span className="text-xs">{entry.action}</span>
                    <ProvenanceTag source={entry.technicalIndicators?.overlay} confidence={entry.signalStrength} timestamp={entry.generatedAt} />
                    {highlight && <span className="ml-2 text-xs text-red-600 font-bold">Anomaly</span>}
                    <a
                      href={deepLink(entry.id)}
                      className="ml-2 text-xs text-blue-500 underline"
                      aria-label="Copy deep link"
                      tabIndex={0}
                    >🔗</a>
                  </div>
                  {expanded && (
                    <div className="mt-2 space-y-2">
                      <div className="text-xs text-gray-700 dark:text-gray-200">
                        <b>Rationale:</b> {entry.technicalIndicators?.rationale || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-200">
                        <b>Notes:</b> {entry.notes || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-200">
                        <b>Status:</b> {entry.status}
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-200">
                        <b>Rebalance:</b> {entry.rebalance ? JSON.stringify(entry.rebalance) : 'None'}
                      </div>
                      <div className="flex items-center gap-2">
                        <TagInput
                          tags={entry.tags || []}
                          onAdd={tag => onTag(entry.id, tag)}
                          onRemove={tag => onTag(entry.id, tag)}
                        />
                        <input
                          type="text"
                          className="border rounded px-1 py-0.5 text-xs"
                          placeholder="Add annotation"
                          value={entry.annotation || ''}
                          onChange={e => onAnnotate(entry.id, e.target.value)}
                          aria-label="Add annotation"
                        />
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}; 