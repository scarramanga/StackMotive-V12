export async function connectKraken() {
  // Placeholder: In production, handle API key or OAuth here
  return { connected: true, message: 'Connected to Kraken (stub)' };
}

export async function getPositions() {
  // Placeholder: Fetch positions from Kraken
  return [
    { symbol: 'BTC', quantity: 0.2, avgPrice: 41000 },
    { symbol: 'SOL', quantity: 10, avgPrice: 150 },
  ];
}

export async function placeOrder(order: { symbol: string; action: string; quantity: number }) {
  // Placeholder: Place order via Kraken API
  return { success: true, orderId: 'KRAKEN-MOCK-123', message: 'Order placed (stub)' };
}

export async function getAccountBalance() {
  // Placeholder: Fetch account balance from Kraken
  return { currency: 'NZD', balance: 5000 };
} 