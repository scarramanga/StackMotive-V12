export interface Trade {
  symbol: string;
  action: 'buy' | 'sell' | 'short' | 'long';
  amount: number;
}

export interface VaultBelief {
  id: string;
  statement: string;
  confidence: number;
}

export function validateTradeAgainstVault(trade: Trade, beliefs: VaultBelief[]): { valid: boolean; reason?: string } {
  if (trade.symbol === 'BTC' && trade.action === 'short' && beliefs.some(b => b.id === 'btc-sov-store' && b.confidence >= 4)) {
    return { valid: false, reason: 'Vault prohibits shorting BTC (core thesis: sovereign store-of-value).' };
  }
  if (trade.symbol === 'USD' && trade.action === 'buy' && beliefs.some(b => b.id === 'usd-debase' && b.confidence >= 4)) {
    return { valid: false, reason: 'Vault prohibits buying USD (core thesis: USD debasement).' };
  }
  if (trade.amount > 100 && beliefs.some(b => b.id === 'risk-allocation' && b.confidence >= 3)) {
    return { valid: false, reason: 'Vault risk rule: allocation exceeds allowed maximum.' };
  }
  return { valid: true };
} 