import React, { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  overlays?: string[];
  width?: string | number;
  height?: string | number;
}

// Block 39: TradingView Integration (Lite)
export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ symbol, overlays, width = '100%', height = 400 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!symbol || typeof window === 'undefined' || !containerRef.current) return;
    // Only support certain asset types (e.g., stocks, ETFs, crypto)
    const supported = /^[A-Z0-9_\-]+(:[A-Z]+)?$/.test(symbol);
    if (!supported) return;
    // Remove previous widget if any
    containerRef.current.innerHTML = '';
    // TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.TradingView) {
        // @ts-ignore
        new window.TradingView.widget({
          autosize: true,
          symbol,
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          container_id: containerRef.current!.id,
          studies_overrides: overlays ? overlays.reduce((acc, o) => { acc[o] = {}; return acc; }, {} as any) : undefined,
        });
      }
    };
    containerRef.current.appendChild(script);
    // Cleanup
    return () => { containerRef.current && (containerRef.current.innerHTML = ''); };
  }, [symbol, overlays]);

  // Hide for unsupported assets
  const supported = /^[A-Z0-9_\-]+(:[A-Z]+)?$/.test(symbol);
  if (!supported) return null;

  return (
    <div className="tradingview-widget-container" style={{ width, height }}>
      <div id={`tv-widget-${symbol}`} ref={containerRef} style={{ width: '100%', height }} />
    </div>
  );
}; 