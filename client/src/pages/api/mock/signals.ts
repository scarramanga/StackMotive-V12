export default function handler(req: any, res: any) {
  setTimeout(() => {
    res.status(200).json([
      { asset: 'BTC', type: 'MACD', strength: 80, context: 'technical' },
      { asset: 'BTC', type: 'RSI', strength: 65, context: 'technical' },
      { asset: 'BTC', type: 'WhaleAlert', strength: 90, context: 'social' },
      { asset: 'ETH', type: 'VolumeSpike', strength: 70, context: 'macro' },
      { asset: 'ETH', type: 'RSI', strength: 55, context: 'technical' },
      { asset: 'TSLA', type: 'MACD', strength: 40, context: 'technical' },
    ]);
  }, 400);
} 