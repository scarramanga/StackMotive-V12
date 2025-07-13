// Block 44 Implementation: EasyCrypto adapter (NZ fiat ramp only)
// All functions are stubbed, SSR-safe, frontend-only

export async function connectEasyCrypto() {
  // Placeholder: In production, handle API key or OAuth here
  return { connected: true, message: 'Connected to EasyCrypto (stub)' };
}

export async function getBalances() {
  // Placeholder: Fetch balances from EasyCrypto
  return [
    { currency: 'NZD', balance: 2000 },
    { currency: 'BTC', balance: 0.01 },
  ];
} 