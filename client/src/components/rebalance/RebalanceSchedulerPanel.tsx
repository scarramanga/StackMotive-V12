// Block 9: RebalanceSchedulerPanel UI
import React, { useState } from 'react';
import { useRebalanceScheduler } from '../../hooks/useRebalanceScheduler';
import { useSessionStore } from '../../store/session';

export default function RebalanceSchedulerPanel({ strategySignals, marketEvents, portfolio, overlays }: any) {
  const user = useSessionStore(s => s.user);
  const isPremium = user?.isPremium;
  const { prompt, confirmRebalance, skipRebalance, history, schedule, setSchedule } = useRebalanceScheduler({ strategySignals, marketEvents, portfolio, overlays });
  const [showConfig, setShowConfig] = useState(false);

  if (!isPremium) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Rebalance Scheduler (Premium Only)</h1>
        <p className="mb-4">Upgrade to unlock automated rebalance scheduling and prompts.</p>
        <button className="btn btn-primary">Upgrade Now</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Rebalance Scheduler</h1>
      <button className="btn btn-secondary mb-4" onClick={() => setShowConfig(!showConfig)}>
        {showConfig ? 'Hide' : 'Configure Scheduler'}
      </button>
      {showConfig && (
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <h2 className="font-semibold mb-2">Scheduler Settings</h2>
          <label className="block mb-2">
            <input type="checkbox" checked={schedule.enabled} onChange={e => setSchedule({ ...schedule, enabled: e.target.checked })} /> Enable Scheduler
          </label>
          <label className="block mb-2">
            Interval:
            <select value={schedule.interval || ''} onChange={e => setSchedule({ ...schedule, interval: (e.target.value ? e.target.value as any : null) })} className="ml-2">
              <option value="">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label className="block mb-2">
            <input type="checkbox" checked={schedule.triggers.includes('macro')} onChange={e => setSchedule({ ...schedule, triggers: e.target.checked ? [...schedule.triggers, 'macro'] : schedule.triggers.filter(t => t !== 'macro') })} /> Macro Triggers
          </label>
          <label className="block mb-2">
            <input type="checkbox" checked={schedule.triggers.includes('signal')} onChange={e => setSchedule({ ...schedule, triggers: e.target.checked ? [...schedule.triggers, 'signal'] : schedule.triggers.filter(t => t !== 'signal') })} /> Signal Triggers
          </label>
          <label className="block mb-2">
            <input type="checkbox" checked={schedule.paused} onChange={e => setSchedule({ ...schedule, paused: e.target.checked })} /> Paused
          </label>
          <label className="block mb-2">
            <input type="checkbox" checked={schedule.cooldownOverride} onChange={e => setSchedule({ ...schedule, cooldownOverride: e.target.checked })} /> Override Cooldown (allow multiple per day)
          </label>
        </div>
      )}
      {prompt && (
        <div className="mb-4 p-4 bg-yellow-100 rounded">
          <h2 className="font-semibold mb-2">Rebalance Prompt</h2>
          <div className="mb-2">{prompt.rationale}</div>
          <div className="mb-2">
            <b>Before:</b> <pre className="inline text-xs">{JSON.stringify(prompt.beforeWeights, null, 2)}</pre>
          </div>
          <div className="mb-2">
            <b>After:</b> <pre className="inline text-xs">{JSON.stringify(prompt.afterWeights, null, 2)}</pre>
          </div>
          <button className="btn btn-primary mr-2" onClick={confirmRebalance}>Confirm</button>
          <button className="btn btn-secondary" onClick={skipRebalance}>Skip</button>
        </div>
      )}
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Rebalance History</h2>
        {history.length === 0 && <div className="text-gray-500">No rebalances yet.</div>}
        {history.map((h, i) => (
          <div key={h.id} className="mb-2 p-3 bg-green-50 rounded">
            <div className="flex justify-between items-center">
              <div>
                <b>{new Date(h.timestamp).toLocaleString()}</b> — {h.rationale}
              </div>
              <span className="text-xs">{h.confirmed ? 'Confirmed' : 'Skipped'}</span>
            </div>
            <div className="text-xs">Before: {JSON.stringify(h.beforeWeights)}</div>
            <div className="text-xs">After: {JSON.stringify(h.afterWeights)}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 