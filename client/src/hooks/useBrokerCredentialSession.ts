import { useRef } from 'react';

type Broker = 'kucoin' | 'kraken' | 'easyCrypto' | 'ibkr' | 'sharesies';

type Credentials =
  | { apiKey: string; apiSecret: string } // KuCoin
  | { apiKey: string; privateKey: string } // Kraken
  | { email: string; apiToken: string } // EasyCrypto
  | { oauth: boolean } // IBKR
  | { csv: File | null } // Sharesies
  | Record<string, any>;

export function useBrokerCredentialSession() {
  // Volatile, in-memory only
  const session = useRef<{ [broker: string]: Credentials | undefined }>({});

  function setCredentials(broker: Broker, creds: Credentials) {
    session.current[broker] = creds;
  }

  function getCredentials(broker: Broker): Credentials | undefined {
    return session.current[broker];
  }

  function clearCredentials(broker: Broker) {
    delete session.current[broker];
  }

  return { setCredentials, getCredentials, clearCredentials };
} 