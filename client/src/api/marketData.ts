// Block 28: Market Overview Dashboard
import axios from 'axios';

export interface VolatilityIndex {
  value: number;
  change: number;
  timestamp: string;
}
export interface Rate {
  name: string;
  value: number;
  change: number;
}
export interface MajorIndex {
  name: string;
  value: number;
  change: number;
  sparkline: number[];
}
export interface NewsSentiment {
  summary: 'bullish' | 'bearish' | 'neutral';
  score: number;
  sources: { title: string; url: string; sentiment: string }[];
}
export interface MacroSignals {
  cpi: number; // Consumer Price Index YoY %
  debt: number; // Government debt-to-GDP %
  fiatDebasement: number; // Fiat debasement rate (e.g., M2 YoY growth)
  qeActive: boolean; // Quantitative easing active
}
export interface PriceHistory {
  prices: number[];
  dates: string[];
}

export async function getVolatilityIndex(): Promise<VolatilityIndex> {
  const { data } = await axios.get('/api/market/vix');
  return data;
}
export async function getRates(): Promise<Rate[]> {
  const { data } = await axios.get('/api/market/rates');
  return data;
}
export async function getMajorIndices(): Promise<MajorIndex[]> {
  const { data } = await axios.get('/api/market/indices');
  return data;
}
export async function getNewsSentiment(): Promise<NewsSentiment> {
  const { data } = await axios.get('/api/market/news-sentiment');
  return data;
}
export async function getMarketOverview() {
  const [vix, rates, indices, sentiment] = await Promise.all([
    getVolatilityIndex(),
    getRates(),
    getMajorIndices(),
    getNewsSentiment(),
  ]);
  return { vix, rates, indices, sentiment };
}
export async function getMacroSignals(): Promise<MacroSignals> {
  // All endpoints must return real, up-to-date macro data
  const [cpiRes, debtRes, fiatRes, qeRes] = await Promise.all([
    axios.get('/api/market/cpi'),
    axios.get('/api/market/debt'),
    axios.get('/api/market/fiat-debasement'),
    axios.get('/api/market/qe-status'),
  ]);
  return {
    cpi: cpiRes.data.value, // e.g., 3.2
    debt: debtRes.data.value, // e.g., 120
    fiatDebasement: fiatRes.data.value, // e.g., 0.08
    qeActive: qeRes.data.active, // boolean
  };
}
export async function getMarketPriceHistory(symbol: string): Promise<PriceHistory> {
  // Real endpoint for historical price data
  const { data } = await axios.get(`/api/market/history/${symbol}`);
  // Assume data: { prices: number[], dates: string[] }
  return data;
} 