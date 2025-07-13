import React from 'react';
import jsPDF from 'jspdf';

export interface BacktestResult {
  metrics: { label: string; value: string | number }[];
  allocation: { asset: string; weight: number }[];
  signalLogs: { date: string; asset: string; action: string; score: number }[];
}

interface BacktestExportPanelProps {
  result: BacktestResult;
}

// Block 48: Backtest Export Panel
export const BacktestExportPanel: React.FC<BacktestExportPanelProps> = ({ result }) => {
  const handleExportCSV = () => {
    // CSV for metrics, allocation, and signal logs
    let csv = 'Metric,Value\n';
    csv += result.metrics.map(m => `${m.label},${m.value}`).join('\n') + '\n\n';
    csv += 'Asset,Weight\n';
    csv += result.allocation.map(a => `${a.asset},${a.weight}`).join('\n') + '\n\n';
    csv += 'Date,Asset,Action,Score\n';
    csv += result.signalLogs.map(s => `${s.date},${s.asset},${s.action},${s.score}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backtest_Export_${new Date().toISOString().replace(/[:.]/g,'-')}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Backtest Report', 14, 18);
    doc.setFontSize(12);
    let y = 28;
    doc.text('Key Metrics:', 14, y);
    y += 8;
    result.metrics.forEach(m => {
      doc.text(`${m.label}: ${m.value}`, 18, y);
      y += 7;
    });
    y += 5;
    doc.text('Allocation:', 14, y);
    y += 8;
    result.allocation.forEach(a => {
      doc.text(`${a.asset}: ${(a.weight*100).toFixed(1)}%`, 18, y);
      y += 7;
    });
    y += 5;
    doc.text('Signal Logs:', 14, y);
    y += 8;
    result.signalLogs.slice(0, 30).forEach(s => {
      doc.text(`${s.date} | ${s.asset} | ${s.action} | ${s.score}`, 18, y);
      y += 6;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save(`Backtest_Report_${new Date().toISOString().replace(/[:.]/g,'-')}.pdf`);
  };

  return (
    <section className="rounded-xl bg-card dark:bg-card/80 p-4 shadow-lg border border-border max-w-2xl mx-auto my-6 transition-colors" aria-labelledby="backtest-export-title">
      <h2 id="backtest-export-title" className="text-lg font-semibold mb-2">Backtest Export</h2>
      <div className="mb-4 flex gap-2">
        <button className="btn btn-secondary" onClick={handleExportCSV}>Export CSV</button>
        <button className="btn btn-primary" onClick={handleExportPDF}>Export PDF</button>
      </div>
      <div className="mb-4">
        <h3 className="font-semibold mb-1">Key Metrics</h3>
        <ul className="text-sm">
          {result.metrics.map(m => <li key={m.label}><span className="font-medium">{m.label}:</span> {m.value}</li>)}
        </ul>
      </div>
      <div className="mb-4">
        <h3 className="font-semibold mb-1">Allocation Heatmap</h3>
        <div className="flex flex-wrap gap-2">
          {result.allocation.map(a => (
            <div key={a.asset} className="rounded bg-blue-100 dark:bg-blue-900 px-3 py-1 text-xs font-mono">
              {a.asset}: {(a.weight*100).toFixed(1)}%
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-1">Signal Logs</h3>
        <div className="overflow-x-auto max-h-48">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-1 px-2 text-left">Date</th>
                <th className="py-1 px-2 text-left">Asset</th>
                <th className="py-1 px-2 text-left">Action</th>
                <th className="py-1 px-2 text-left">Score</th>
              </tr>
            </thead>
            <tbody>
              {result.signalLogs.map((s, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-1 px-2 font-mono">{s.date}</td>
                  <td className="py-1 px-2">{s.asset}</td>
                  <td className="py-1 px-2">{s.action}</td>
                  <td className="py-1 px-2">{s.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}; 