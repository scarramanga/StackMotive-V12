import { useCallback } from 'react';
import * as mockBrokerAPI from '../lib/mockBrokerAPI';
import * as ibkr from '../lib/brokerAdapters/ibkr';
import * as kucoin from '../lib/brokerAdapters/kucoin';
import * as kraken from '../lib/brokerAdapters/kraken';
import * as easyCrypto from '../lib/brokerAdapters/easyCrypto';

/**
 * useBrokerAdapter - Broker integration hook (stubbed for dry-run/testing)
 *
 * Swap out mockBrokerAPI with a real broker API implementation for production.
 * All methods are SSR-safe and return mock data.
 */
export function useBrokerAdapter(mode: string) {
  // SSR-safe, no real broker logic
  if (mode === 'ibkr') {
    return {
      connect: ibkr.connectIBKR,
      getPositions: ibkr.getPositions,
      placeOrder: ibkr.placeOrder,
      getAccountBalance: ibkr.getAccountBalance,
    };
  } else if (mode === 'kucoin') {
    return {
      connect: kucoin.connectKucoin,
      getPositions: kucoin.getPositions,
      placeOrder: kucoin.placeOrder,
      getAccountBalance: kucoin.getAccountBalance,
    };
  } else if (mode === 'kraken') {
    return {
      connect: kraken.connectKraken,
      getPositions: kraken.getPositions,
      placeOrder: kraken.placeOrder,
      getAccountBalance: kraken.getAccountBalance,
    };
  } else if (mode === 'easyCrypto') {
    return {
      connect: easyCrypto.connectEasyCrypto,
      getPositions: async () => [],
      placeOrder: async () => ({ success: false, message: 'EasyCrypto: trading not supported' }),
      getAccountBalance: easyCrypto.getBalances,
    };
  } else {
    return {
      getPositions: mockBrokerAPI.getPositions,
      placeOrder: mockBrokerAPI.placeOrder,
      getAccountBalance: mockBrokerAPI.getAccountBalance,
    };
  }
} 