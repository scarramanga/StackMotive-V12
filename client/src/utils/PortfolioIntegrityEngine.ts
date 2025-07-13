import type { Position } from '@/contexts/PortfolioContext';

export type PositionChange =
  | { type: 'added'; symbol: string; newPosition: Position }
  | { type: 'removed'; symbol: string; oldPosition: Position }
  | { type: 'modified'; symbol: string; oldPosition: Position; newPosition: Position; deltas: Record<string, { from: any; to: any }> };

// Block 22 Implementation: Diff two position arrays by symbol
export function diffPositions(oldPositions: Position[], newPositions: Position[]): PositionChange[] {
  const oldMap = Object.fromEntries(oldPositions.map(p => [p.symbol, p]));
  const newMap = Object.fromEntries(newPositions.map(p => [p.symbol, p]));
  const changes: PositionChange[] = [];

  // Added
  for (const symbol in newMap) {
    if (!oldMap[symbol]) {
      changes.push({ type: 'added', symbol, newPosition: newMap[symbol] });
    }
  }
  // Removed
  for (const symbol in oldMap) {
    if (!newMap[symbol]) {
      changes.push({ type: 'removed', symbol, oldPosition: oldMap[symbol] });
    }
  }
  // Modified
  for (const symbol in newMap) {
    if (oldMap[symbol]) {
      const oldP = oldMap[symbol];
      const newP = newMap[symbol];
      const deltas: Record<string, { from: any; to: any }> = {};
      for (const key of Object.keys(newP) as (keyof Position)[]) {
        if (key !== 'symbol' && oldP[key] !== newP[key]) {
          deltas[key] = { from: oldP[key], to: newP[key] };
        }
      }
      if (Object.keys(deltas).length > 0) {
        changes.push({ type: 'modified', symbol, oldPosition: oldP, newPosition: newP, deltas });
      }
    }
  }
  return changes;
} 