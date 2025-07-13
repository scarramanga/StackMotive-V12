import React, { useState } from 'react';
import { useUserPreferencesStore } from '../store/userPreferences';
import { runBacktest } from '../engines/BacktestEngine';
import { Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import { useSimulationHistoryStore } from '../store/simulationHistory';
// import type { SimulationHistoryState } from '../store/simulationHistory';

// Block 30: Strategy Simulation Toggle (enhanced)
export const StrategySimulator: React.FC<{ portfolio: any; overlays: any[] }> = ({ portfolio, overlays }) => {
  const simulationEnabled = useUserPreferencesStore((s: any) => s.simulationEnabled);
  const setSimulationEnabled = useUserPreferencesStore((s: any) => s.setSimulationEnabled);
  const lastSimOverlayId = useUserPreferencesStore((s: any) => s.lastSimOverlayId);
  const setLastSimOverlayId = useUserPreferencesStore((s: any) => s.setLastSimOverlayId);
  const addSimulationHistory = useSimulationHistoryStore((s: any) => s.addSimulationHistory);

  const [selectedOverlayIds, setSelectedOverlayIds] = useState<string[]>(lastSimOverlayId ? [lastSimOverlayId] : []);
  const [simResults, setSimResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Run simulation for all selected overlays
  React.useEffect(() => {
    if (simulationEnabled && selectedOverlayIds.length) {
      setLoading(true);
      setError(null);
      Promise.all(selectedOverlayIds.map(async (id) => {
        const overlay = overlays.find(o => o.id === id);
        if (!overlay) return null;
        try {
          const result = await runBacktest({ portfolio, overlay });
          addSimulationHistory({
            timestamp: new Date().toISOString(),
            overlayId: id,
            overlayName: overlay.name,
            result,
          });
          return { id, result };
        } catch (e: any) {
          setError(e.message || 'Simulation failed');
          return null;
        }
      })).then(results => {
        const resMap: Record<string, any> = {};
        results.forEach(r => { if (r) resMap[r.id] = r.result; });
        setSimResults(resMap);
        setLoading(false);
      });
    } else {
      setSimResults({});
    }
  }, [simulationEnabled, selectedOverlayIds, portfolio, overlays, addSimulationHistory]);

  // Chart data
  const actualCurve = portfolio.performance || [];
  const chartData = {
    labels: actualCurve.map((p: any) => p.date),
    datasets: [
      {
        label: 'Actual',
        data: actualCurve.map((p: any) => p.value),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        fill: false,
      },
      ...selectedOverlayIds.filter(id => simResults[id]).map((id, idx) => ({
        label: overlays.find(o => o.id === id)?.name || `Sim ${idx + 1}`,
        data: simResults[id]?.performance.map((p: any) => p.value),
        borderColor: ['#16a34a', '#f59e42', '#e11d48', '#a21caf'][idx % 4],
        backgroundColor: 'rgba(22,163,74,0.1)',
        fill: false,
      })),
    ],
  };

  // Advanced analytics
  function getAnalytics(result: any) {
    if (!result) return null;
    return {
      winRatio: ((result.wins / (result.trades || 1)) * 100).toFixed(1),
      volatility: result.volatility,
      maxDrawdown: result.maxDrawdown,
      sharpe: result.sharpeRatio,
      avgTradeDuration: result.avgTradeDuration,
      percentDiff: actualCurve.length && result.performance.length
        ? (((result.performance[result.performance.length - 1].value - actualCurve[actualCurve.length - 1].value) / actualCurve[actualCurve.length - 1].value) * 100).toFixed(2)
        : null,
    };
  }

  // CSV export
  const handleExportCSV = () => {
    let csv = 'Date,Actual,' + selectedOverlayIds.map(id => overlays.find(o => o.id === id)?.name).join(',') + '\n';
    actualCurve.forEach((p: any, i: number) => {
      csv += p.date + ',' + p.value + ',' + selectedOverlayIds.map(id => simResults[id]?.performance[i]?.value ?? '').join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'strategy-simulation.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Shareable link (encode overlay IDs)
  const shareLink = simulationEnabled && selectedOverlayIds.length
    ? `${window.location.origin}${window.location.pathname}?sim=${selectedOverlayIds.join(',')}`
    : '';

  // PDF snapshot
  const handleSnapshot = () => {
    const doc = new jsPDF();
    doc.text('Strategy Simulation Result', 10, 10);
    selectedOverlayIds.forEach((id, idx) => {
      const overlay = overlays.find(o => o.id === id);
      const analytics = getAnalytics(simResults[id]);
      doc.text(`Overlay: ${overlay?.name || id}`, 10, 20 + idx * 30);
      doc.text(`Win Ratio: ${analytics?.winRatio}%`, 10, 30 + idx * 30);
      doc.text(`Volatility: ${analytics?.volatility}`, 10, 40 + idx * 30);
      doc.text(`Max Drawdown: ${analytics?.maxDrawdown}`, 10, 50 + idx * 30);
      doc.text(`Sharpe: ${analytics?.sharpe}`, 10, 60 + idx * 30);
      doc.text(`Avg Trade Duration: ${analytics?.avgTradeDuration}`, 10, 70 + idx * 30);
      doc.text(`% Diff: ${analytics?.percentDiff}`, 10, 80 + idx * 30);
    });
    doc.save('strategy-simulation.pdf');
  };

  // Overlay selection UI
  const handleOverlayToggle = (id: string) => {
    setSelectedOverlayIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
    setLastSimOverlayId(id);
  };

  return (
    <section className="rounded-xl bg-card dark:bg-card/80 p-4 shadow-lg border border-border max-w-3xl mx-auto my-6 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Strategy Simulator</h2>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={simulationEnabled}
            onChange={e => setSimulationEnabled(e.target.checked)}
            className="accent-primary"
          />
          Simulate
        </label>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <label className="text-xs font-medium mr-2">Overlays:</label>
        {overlays.map((o: any) => (
          <button
            key={o.id}
            className={`px-2 py-1 rounded text-xs font-semibold border ${selectedOverlayIds.includes(o.id) ? 'bg-primary text-white' : 'bg-muted text-foreground'}`}
            onClick={() => handleOverlayToggle(o.id)}
            disabled={!simulationEnabled}
            aria-pressed={selectedOverlayIds.includes(o.id)}
          >
            {o.name}
          </button>
        ))}
      </div>
      {loading && <div className="text-center text-muted-foreground">Simulating…</div>}
      {error && <div className="text-center text-destructive">{error}</div>}
      <div className="mb-4">
        <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: true } } }} />
      </div>
      {simulationEnabled && selectedOverlayIds.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-4 text-xs">
          {selectedOverlayIds.map(id => {
            const analytics = getAnalytics(simResults[id]);
            return analytics ? (
              <div key={id} className="bg-muted/40 rounded p-2">
                <div className="font-bold">{overlays.find(o => o.id === id)?.name}</div>
                <div>Win Ratio: <span className="font-bold">{analytics.winRatio}%</span></div>
                <div>Volatility: <span className="font-bold">{analytics.volatility}</span></div>
                <div>Max Drawdown: <span className="font-bold">{analytics.maxDrawdown}</span></div>
                <div>Sharpe: <span className="font-bold">{analytics.sharpe}</span></div>
                <div>Avg Trade Duration: <span className="font-bold">{analytics.avgTradeDuration}</span></div>
                <div>% Diff: <span className="font-bold">{analytics.percentDiff}%</span></div>
              </div>
            ) : null;
          })}
          <button className="ml-auto px-3 py-1 rounded bg-primary text-white text-xs font-semibold" onClick={handleSnapshot}>Snapshot to PDF</button>
          <button className="ml-auto px-3 py-1 rounded bg-muted text-foreground text-xs font-semibold border" onClick={handleExportCSV}>Export CSV</button>
          {shareLink && <a className="ml-auto px-3 py-1 rounded bg-muted text-primary text-xs font-semibold border underline" href={shareLink}>Share Link</a>}
        </div>
      )}
    </section>
  );
}; 