// Block 16 Implementation: CrisisEngine stub
export function isCrisisMode(): boolean {
  // Mock values
  const vix = 32; // Volatility Index
  const dxy = 106; // Dollar Index
  const btc24hChange = -6; // BTC 24h % change

  // Check localStorage override
  if (typeof window !== 'undefined' && localStorage.getItem('forceCrisisMode') === 'true') {
    return true;
  }

  // Hardcoded mock thresholds
  if (vix > 30 || dxy > 105 || btc24hChange < -5) {
    return true;
  }
  return false;
} 