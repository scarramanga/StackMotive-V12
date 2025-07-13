/**
 * StackMotive Environment Configuration
 * Centralized configuration management for all environments
 */

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  connectionTimeout: number;
}

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  environment: 'test' | 'live';
  successUrl: string;
  cancelUrl: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  maxRetries: number;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  retentionDays: number;
  maxFileSize: string;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  rateLimitWindow: number;
  rateLimitMax: number;
  corsOrigins: string[];
  trustedProxies: string[];
}

export interface APIConfig {
  baseUrl: string;
  port: number;
  timeout: number;
  maxRequestSize: string;
  enableDocs: boolean;
  enableMetrics: boolean;
}

export interface ExternalServicesConfig {
  finnhub: {
    apiKey: string;
    baseUrl: string;
  };
  newsapi: {
    apiKey: string;
    baseUrl: string;
  };
  openai: {
    apiKey: string;
    organization?: string;
    model: string;
  };
  sentry?: {
    dsn: string;
    environment: string;
  };
}

export interface EnvironmentConfig {
  environment: Environment;
  debug: boolean;
  
  // Core services
  api: APIConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  
  // Authentication & Security
  security: SecurityConfig;
  
  // External integrations
  stripe: StripeConfig;
  externalServices: ExternalServicesConfig;
  
  // System configuration
  logging: LoggingConfig;
  
  // Feature flags
  features: {
    enablePaperTrading: boolean;
    enableRealTrading: boolean;
    enableAIAgents: boolean;
    enableAdvancedAnalytics: boolean;
    enableBilling: boolean;
    enableNotifications: boolean;
    enableWebhooks: boolean;
  };
  
  // Monitoring
  monitoring: {
    enableHealthChecks: boolean;
    enableMetrics: boolean;
    enableAlerts: boolean;
    metricsPort: number;
  };
}

// Development Environment
const developmentConfig: EnvironmentConfig = {
  environment: 'development',
  debug: true,
  
  api: {
    baseUrl: 'http://localhost:3000',
    port: 8000,
    timeout: 30000,
    maxRequestSize: '10mb',
    enableDocs: true,
    enableMetrics: true,
  },
  
  database: {
    host: 'localhost',
    port: 5432,
    database: 'stackmotive',
    username: 'stackmotive',
    password: 'stackmotive123',
    ssl: false,
    maxConnections: 20,
    connectionTimeout: 10000,
  },
  
  redis: {
    host: 'localhost',
    port: 6379,
    db: 0,
    maxRetries: 3,
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    jwtExpiresIn: '24h',
    bcryptRounds: 10,
    rateLimitWindow: 900000, // 15 minutes
    rateLimitMax: 100,
    corsOrigins: ['http://localhost:3000', 'http://localhost:5173'],
    trustedProxies: [],
  },
  
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51RQFeJRfTZm4mhTAKEAdQtyVFCgooOgWj1Xx7Sl79UMYLqAeCAvoWUT5DkfSERrG7TriYwyprj5OoOnI6enQCoH900KcG5TCdn',
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_51RQFeJRfTZm4mhTAUMPDT1aRk0BreePfNV9nGmt01a56L940DdHDFNUZaNPagUAw578fny7PFD0XFARmKBvFOasy0083VoR24n',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_placeholder',
    environment: 'test',
    successUrl: 'http://localhost:3000/billing/success',
    cancelUrl: 'http://localhost:3000/billing/cancel',
  },
  
  externalServices: {
    finnhub: {
      apiKey: process.env.FINNHUB_API_KEY || '',
      baseUrl: 'https://finnhub.io/api/v1',
    },
    newsapi: {
      apiKey: process.env.NEWSAPI_KEY || '',
      baseUrl: 'https://newsapi.org/v2',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4',
    },
  },
  
  logging: {
    level: 'debug',
    enableConsole: true,
    enableFile: true,
    enableRemote: false,
    retentionDays: 7,
    maxFileSize: '10MB',
  },
  
  features: {
    enablePaperTrading: true,
    enableRealTrading: true,
    enableAIAgents: true,
    enableAdvancedAnalytics: true,
    enableBilling: true,
    enableNotifications: true,
    enableWebhooks: true,
  },
  
  monitoring: {
    enableHealthChecks: true,
    enableMetrics: true,
    enableAlerts: false,
    metricsPort: 9090,
  },
};

// Staging Environment
const stagingConfig: EnvironmentConfig = {
  ...developmentConfig,
  environment: 'staging',
  debug: false,
  
  api: {
    ...developmentConfig.api,
    baseUrl: process.env.STAGING_API_URL || 'https://staging-api.stackmotive.com',
    enableDocs: true,
  },
  
  database: {
    host: process.env.STAGING_DB_HOST || 'staging-db.stackmotive.com',
    port: parseInt(process.env.STAGING_DB_PORT || '5432'),
    database: process.env.STAGING_DB_NAME || 'stackmotive_staging',
    username: process.env.STAGING_DB_USER || 'stackmotive',
    password: process.env.STAGING_DB_PASSWORD || '',
    ssl: true,
    maxConnections: 50,
    connectionTimeout: 10000,
  },
  
  security: {
    ...developmentConfig.security,
    jwtSecret: process.env.JWT_SECRET || '',
    corsOrigins: [
      'https://staging.stackmotive.com',
      'https://staging-app.stackmotive.com'
    ],
  },
  
  stripe: {
    ...developmentConfig.stripe,
    successUrl: 'https://staging.stackmotive.com/billing/success',
    cancelUrl: 'https://staging.stackmotive.com/billing/cancel',
  },
  
  logging: {
    level: 'info',
    enableConsole: true,
    enableFile: true,
    enableRemote: true,
    retentionDays: 30,
    maxFileSize: '50MB',
  },
  
  monitoring: {
    ...developmentConfig.monitoring,
    enableAlerts: true,
  },
};

// Production Environment
const productionConfig: EnvironmentConfig = {
  ...stagingConfig,
  environment: 'production',
  debug: false,
  
  api: {
    ...stagingConfig.api,
    baseUrl: process.env.PRODUCTION_API_URL || 'https://api.stackmotive.com',
    enableDocs: false, // Disable API docs in production
  },
  
  database: {
    host: process.env.PRODUCTION_DB_HOST || '',
    port: parseInt(process.env.PRODUCTION_DB_PORT || '5432'),
    database: process.env.PRODUCTION_DB_NAME || 'stackmotive_production',
    username: process.env.PRODUCTION_DB_USER || '',
    password: process.env.PRODUCTION_DB_PASSWORD || '',
    ssl: true,
    maxConnections: 100,
    connectionTimeout: 5000,
  },
  
  security: {
    ...stagingConfig.security,
    jwtSecret: process.env.JWT_SECRET || '',
    rateLimitMax: 60, // Stricter rate limiting in production
    corsOrigins: [
      'https://stackmotive.com',
      'https://app.stackmotive.com',
      'https://www.stackmotive.com'
    ],
  },
  
  stripe: {
    publishableKey: process.env.STRIPE_LIVE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_LIVE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_LIVE_WEBHOOK_SECRET || '',
    environment: 'live',
    successUrl: 'https://app.stackmotive.com/billing/success',
    cancelUrl: 'https://app.stackmotive.com/billing/cancel',
  },
  
  logging: {
    level: 'warn',
    enableConsole: false,
    enableFile: true,
    enableRemote: true,
    retentionDays: 90,
    maxFileSize: '100MB',
  },
  
  features: {
    ...stagingConfig.features,
    // All features enabled in production
  },
};

// Test Environment
const testConfig: EnvironmentConfig = {
  ...developmentConfig,
  environment: 'test',
  
  database: {
    ...developmentConfig.database,
    database: 'stackmotive_test',
  },
  
  redis: {
    ...developmentConfig.redis,
    db: 1, // Use different Redis DB for tests
  },
  
  logging: {
    level: 'error',
    enableConsole: false,
    enableFile: false,
    enableRemote: false,
    retentionDays: 1,
    maxFileSize: '1MB',
  },
};

// Configuration selector
const configs: Record<Environment, EnvironmentConfig> = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig,
  test: testConfig,
};

/**
 * Get configuration for current environment
 */
export function getConfig(): EnvironmentConfig {
  const env = (process.env.NODE_ENV as Environment) || 'development';
  const config = configs[env];
  
  if (!config) {
    throw new Error(`Unknown environment: ${env}`);
  }
  
  // Validate required environment variables for production
  if (env === 'production') {
    validateProductionConfig(config);
  }
  
  return config;
}

/**
 * Validate production configuration
 */
function validateProductionConfig(config: EnvironmentConfig): void {
  const required = [
    'PRODUCTION_DB_HOST',
    'PRODUCTION_DB_PASSWORD',
    'JWT_SECRET',
    'STRIPE_LIVE_SECRET_KEY',
    'STRIPE_LIVE_PUBLISHABLE_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Check if current environment is production
 */
export function isProduction(): boolean {
  return getConfig().environment === 'production';
}

/**
 * Check if current environment is development
 */
export function isDevelopment(): boolean {
  return getConfig().environment === 'development';
}

/**
 * Check if current environment is staging
 */
export function isStaging(): boolean {
  return getConfig().environment === 'staging';
}

/**
 * Get database URL for current environment
 */
export function getDatabaseUrl(): string {
  const { database } = getConfig();
  const protocol = database.ssl ? 'postgresql' : 'postgresql';
  return `${protocol}://${database.username}:${database.password}@${database.host}:${database.port}/${database.database}`;
}

/**
 * Get Redis URL for current environment
 */
export function getRedisUrl(): string {
  const { redis } = getConfig();
  const auth = redis.password ? `:${redis.password}@` : '';
  return `redis://${auth}${redis.host}:${redis.port}/${redis.db}`;
}

export default getConfig; 