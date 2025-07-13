import React from 'react';
import { useMarketSentiment } from '../hooks/useMarketSentiment';

// Block 28: Market Overview Dashboard
export const MarketOverview: React.FC = () => {
  const { data, loading, error } = useMarketSentiment();

  if (loading) return <div className="p-6 text-center text-muted-foreground">Loading market data…</div>;
  if (error || !data) return <div className="p-6 text-center text-destructive">Failed to load market data.</div>;

  const { vix, rates, indices, sentiment } = data;
  const volatilityBand = vix.value > 30 ? 'High' : vix.value > 20 ? 'Medium' : 'Low';
  const riskMode = vix.value > 25 || sentiment.summary === 'bearish' ? 'Risk-Off' : 'Risk-On';

  return (
    <section className="rounded-xl bg-card dark:bg-card/80 p-4 shadow-lg border border-border max-w-3xl mx-auto my-6 transition-colors">
      <h2 className="text-lg font-semibold mb-2">Market Overview</h2>
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[160px]">
          <div className="text-xs text-muted-foreground">Volatility Index (VIX)</div>
          <div className="text-2xl font-bold flex items-center gap-2">
            {vix.value.toFixed(2)}
            <span className={`text-xs px-2 py-0.5 rounded ${volatilityBand === 'High' ? 'bg-red-200 text-red-800' : volatilityBand === 'Medium' ? 'bg-yellow-200 text-yellow-900' : 'bg-green-200 text-green-900'}`}>{volatilityBand}</span>
          </div>
          <div className="text-xs text-muted-foreground">{vix.change >= 0 ? '+' : ''}{vix.change.toFixed(2)} today</div>
        </div>
        <div className="flex-1 min-w-[160px]">
          <div className="text-xs text-muted-foreground">Trend</div>
          <div className={`text-xl font-bold ${riskMode === 'Risk-Off' ? 'text-red-600' : 'text-green-600'}`}>{riskMode}</div>
        </div>
        <div className="flex-1 min-w-[160px]">
          <div className="text-xs text-muted-foreground">Sentiment</div>
          <div className={`text-xl font-bold ${sentiment.summary === 'bullish' ? 'text-green-600' : sentiment.summary === 'bearish' ? 'text-red-600' : 'text-yellow-600'}`}>{sentiment.summary.charAt(0).toUpperCase() + sentiment.summary.slice(1)}</div>
          <div className="text-xs text-muted-foreground">Score: {sentiment.score.toFixed(2)}</div>
        </div>
      </div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">Major Indices</h3>
        <div className="flex flex-wrap gap-4">
          {indices.map((idx: any) => (
            <div key={idx.name} className="flex-1 min-w-[120px] bg-muted/40 rounded p-2">
              <div className="text-xs text-muted-foreground">{idx.name}</div>
              <div className="text-lg font-bold">{idx.value.toFixed(2)}</div>
              <div className={`text-xs ${idx.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}</div>
              {/* Sparkline chart */}
              <div className="h-6 mt-1 flex items-end gap-0.5">
                {idx.sparkline.map((v: number, i: number) => (
                  <div key={i} className="w-1 rounded bg-primary" style={{ height: `${Math.max(8, v)}%`, opacity: 0.7 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">Rates</h3>
        <div className="flex flex-wrap gap-4">
          {rates.map((rate: any) => (
            <div key={rate.name} className="flex-1 min-w-[100px] bg-muted/40 rounded p-2">
              <div className="text-xs text-muted-foreground">{rate.name}</div>
              <div className="text-lg font-bold">{rate.value.toFixed(2)}</div>
              <div className={`text-xs ${rate.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{rate.change >= 0 ? '+' : ''}{rate.change.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-1">News Sentiment</h3>
        <div className="flex flex-col gap-1">
          {sentiment.sources.map((src: any) => (
            <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer" className="text-xs underline text-primary hover:text-primary/80">
              {src.title} <span className={`ml-1 ${src.sentiment === 'bullish' ? 'text-green-600' : src.sentiment === 'bearish' ? 'text-red-600' : 'text-yellow-600'}`}>[{src.sentiment}]</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}; 