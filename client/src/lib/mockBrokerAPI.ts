// mockBrokerAPI.ts - Mock/stub broker API for adapter layer
// Replace these stubs with real broker API calls in production.

export type Position = {
  symbol: string;
  quantity: number;
  avgPrice: number;
};

export type Order = {
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
};

export async function getPositions(): Promise<Position[]> {
  // Mock: return a static list of positions
  return [
    { symbol: 'BTC', quantity: 0.5, avgPrice: 42000 },
    { symbol: 'ETH', quantity: 2, avgPrice: 3200 },
    { symbol: 'AAPL', quantity: 10, avgPrice: 180 },
  ];
}

export async function placeOrder(order: Order): Promise<{ success: boolean; orderId: string; message: string }> {
  // Mock: always "succeed" and return a fake order ID
  return {
    success: true,
    orderId: 'MOCK-' + Math.floor(Math.random() * 1000000),
    message: `Order to ${order.action} ${order.quantity} ${order.symbol} placed (mock).`,
  };
}

export async function getAccountBalance(): Promise<{ currency: string; balance: number }> {
  // Mock: return a static balance
  return { currency: 'USD', balance: 100000 };
} 