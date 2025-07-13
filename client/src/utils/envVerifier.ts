// Block 105 Implementation

export const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_OPENAI_API_KEY',
  'NEXT_PUBLIC_NEWSAPI_KEY',
  'NEXT_PUBLIC_NEWSDATA_API_KEY',
  'NEXT_PUBLIC_FINNHUB_API_KEY',
  'NEXT_PUBLIC_TELEGRAM_API_KEY',
  'NEXT_PUBLIC_TELEGRAM_CHAT_ID',
  'NEXT_PUBLIC_TWELVEDATA_API_KEY',
  'NEXT_PUBLIC_COINSTATS_API_KEY',
  'NEXT_PUBLIC_COINSTATS_SECRET',
] as const;

type EnvVar = typeof REQUIRED_ENV_VARS[number];

export function verifyEnvVars(): EnvVar[] {
  const missing: EnvVar[] = [];
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  // Only warn in dev or staging
  if (missing.length > 0 && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging')) {
    // eslint-disable-next-line no-console
    console.warn('[envVerifier] Missing required env vars:', missing);
  }
  return missing;
}

export function isEnvValid(): boolean {
  return verifyEnvVars().length === 0;
}
// End Block 105 Implementation 