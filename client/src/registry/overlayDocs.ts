// Block 32: Overlay Documentation Panel
export interface OverlayDoc {
  id: string;
  name: string;
  logic: string;
  inputs: string[];
  outputs: string[];
  glossary: string[];
  notes: string;
  backtestResultId?: string;
}

export const overlayDocs: OverlayDoc[] = [
  {
    id: 'dca-stop-loss',
    name: 'DCA Stop Loss',
    logic: 'Executes dollar-cost averaging buys and triggers stop-loss sales based on technical indicators (e.g., MACD, RSI) and volatility bands.',
    inputs: ['Price', 'MACD', 'RSI', 'Volatility Index'],
    outputs: ['Buy/Sell signals', 'Stop-loss triggers'],
    glossary: ['DCA: Dollar-Cost Averaging', 'Stop Loss: Automated sell to limit loss'],
    notes: 'Combines trend-following and mean-reversion logic. Backtest shows reduced drawdowns in high-volatility regimes.',
    backtestResultId: 'dca-stop-loss-2024Q2',
  },
  {
    id: 'macro-overlay',
    name: 'Macro Overlay',
    logic: 'Adjusts portfolio allocations based on macroeconomic signals (e.g., inflation, rates, news sentiment).',
    inputs: ['CPI', 'Interest Rates', 'News Sentiment'],
    outputs: ['Allocation adjustments', 'Risk-on/off signals'],
    glossary: ['CPI: Consumer Price Index', 'Risk-On/Off: Market risk appetite'],
    notes: 'Macro overlay can override technical signals in extreme macro events. Backtest shows improved risk-adjusted returns during regime shifts.',
    backtestResultId: 'macro-overlay-2024Q2',
  },
  // ...add all real overlays here...
]; 