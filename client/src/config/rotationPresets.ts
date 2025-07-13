// Block 35: Rotation Mode Presets
// Production-grade preset configs for rotation strategies
import { OverlayDecision } from '../hooks/useStrategyOverlay';

export interface RotationPreset {
  name: string;
  description: string;
  overlayDecisions: OverlayDecision[];
}

export const rotationPresets: RotationPreset[] = [
  {
    name: 'Aggressive Growth',
    description: 'Maximize growth with high equity and crypto allocation, minimal defensive assets.',
    overlayDecisions: [
      { asset: 'BTC', action: 'buy', signalScore: 0.95, strategyAlignmentScore: 0.9, confidence: 0.9 },
      { asset: 'ETH', action: 'buy', signalScore: 0.9, strategyAlignmentScore: 0.85, confidence: 0.85 },
      { asset: 'QQQ', action: 'buy', signalScore: 0.85, strategyAlignmentScore: 0.8, confidence: 0.8 },
      { asset: 'XAU', action: 'hold', signalScore: 0.5, strategyAlignmentScore: 0.5, confidence: 0.5 },
      { asset: 'TLT', action: 'hold', signalScore: 0.4, strategyAlignmentScore: 0.4, confidence: 0.4 },
    ],
  },
  {
    name: 'Defensive',
    description: 'Prioritize capital preservation with bonds, gold, and low-volatility assets.',
    overlayDecisions: [
      { asset: 'XAU', action: 'buy', signalScore: 0.9, strategyAlignmentScore: 0.9, confidence: 0.9 },
      { asset: 'TLT', action: 'buy', signalScore: 0.85, strategyAlignmentScore: 0.85, confidence: 0.85 },
      { asset: 'SHY', action: 'buy', signalScore: 0.8, strategyAlignmentScore: 0.8, confidence: 0.8 },
      { asset: 'BTC', action: 'hold', signalScore: 0.5, strategyAlignmentScore: 0.5, confidence: 0.5 },
      { asset: 'QQQ', action: 'hold', signalScore: 0.4, strategyAlignmentScore: 0.4, confidence: 0.4 },
    ],
  },
  {
    name: 'Sovereign Blend',
    description: 'Balanced allocation to hard assets, inflation hedges, and select growth.',
    overlayDecisions: [
      { asset: 'BTC', action: 'buy', signalScore: 0.8, strategyAlignmentScore: 0.8, confidence: 0.8 },
      { asset: 'XAU', action: 'buy', signalScore: 0.8, strategyAlignmentScore: 0.8, confidence: 0.8 },
      { asset: 'TIPS', action: 'buy', signalScore: 0.7, strategyAlignmentScore: 0.7, confidence: 0.7 },
      { asset: 'QQQ', action: 'hold', signalScore: 0.6, strategyAlignmentScore: 0.6, confidence: 0.6 },
      { asset: 'TLT', action: 'hold', signalScore: 0.5, strategyAlignmentScore: 0.5, confidence: 0.5 },
    ],
  },
]; 