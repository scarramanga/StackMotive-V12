/**
 * Environment configuration for the StackMotive application
 * Supports Production, Development, and Sandbox environments
 */

// Environment types
export enum Environment {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  SANDBOX = 'sandbox',
}

// Base configuration interface
export interface EnvironmentConfig {
  environment: Environment;
  apiUrl: string;
  frontendUrl: string;
  database: {
    url: string;
  };
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  brokers: {
    [key: string]: {
      useDemo: boolean;
      apiUrl: string;
      websocketUrl?: string;
    };
  };
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
  session: {
    secret: string;
    maxAge: number;
  };
  stripe?: {
    secretKey: string;
    publicKey: string;
    webhookSecret: string;
  };
}

// Get the current environment from NODE_ENV, defaulting to development
const currentEnv = (process.env.NODE_ENV || 'development') as Environment;

// Use sandbox mode for brokers based on BROKER_SANDBOX env var
const useSandboxBrokers = process.env.BROKER_SANDBOX === 'true';

// Base config that applies to all environments
const baseConfig: Partial<EnvironmentConfig> = {
  logLevel: 'info',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'stackmotive-secret-key',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  brokers: {
    ibkr: {
      useDemo: useSandboxBrokers,
      apiUrl: useSandboxBrokers 
        ? 'https://localhost:5174/v1/api' // IBKR Gateway demo
        : 'https://localhost:5174/v1/api', // IBKR Gateway production
      websocketUrl: 'wss://localhost:5174/v1/api/ws',
    },
    tiger: {
      useDemo: useSandboxBrokers,
      apiUrl: useSandboxBrokers
        ? 'https://openapi-sandbox.tigersecurities.com'
        : 'https://openapi.tigerfintech.com',
    },
    kucoin: {
      useDemo: useSandboxBrokers,
      apiUrl: useSandboxBrokers
        ? 'https://openapi-sandbox.kucoin.com/api/v1'
        : 'https://api.kucoin.com/api/v1',
      websocketUrl: useSandboxBrokers
        ? 'wss://push-sandbox.kucoin.com/endpoint'
        : 'wss://push.kucoin.com/endpoint',
    },
    kraken: {
      useDemo: useSandboxBrokers,
      apiUrl: 'https://api.kraken.com', // Kraken doesn't have a sandbox API, use demo account instead
    },
  },
};

// Environment-specific configurations
const environmentConfigs: Record<Environment, Partial<EnvironmentConfig>> = {
  [Environment.PRODUCTION]: {
    environment: Environment.PRODUCTION,
    apiUrl: process.env.API_URL || 'https://api.stackmotive.com',
    frontendUrl: process.env.FRONTEND_URL || 'https://stackmotive.com',
    logLevel: 'error',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      publicKey: process.env.VITE_STRIPE_PUBLIC_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
  },
  [Environment.DEVELOPMENT]: {
    environment: Environment.DEVELOPMENT,
    apiUrl: process.env.API_URL || 'http://localhost:5174',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
    logLevel: 'debug',
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      publicKey: process.env.VITE_STRIPE_PUBLIC_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
  },
  [Environment.SANDBOX]: {
    environment: Environment.SANDBOX,
    apiUrl: process.env.API_URL || 'http://localhost:5174',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
    logLevel: 'debug',
  },
};

// Merge base config with environment-specific config
export const config: EnvironmentConfig = {
  ...baseConfig,
  ...environmentConfigs[currentEnv],
} as EnvironmentConfig;

// Helper function to check the current environment
export function isProduction(): boolean {
  return config.environment === Environment.PRODUCTION;
}

export function isDevelopment(): boolean {
  return config.environment === Environment.DEVELOPMENT;
}

export function isSandbox(): boolean {
  return config.environment === Environment.SANDBOX;
}

// Helper to get broker config
export function getBrokerConfig(brokerName: string) {
  return config.brokers[brokerName];
}