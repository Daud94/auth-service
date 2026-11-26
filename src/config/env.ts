export type AppConfig = {
  jwtSecret: string;
  internalApiKey: string;
  smsWebhookSecret: string;
  corsOrigins: string[];
  bcryptRounds: number;
};

const MIN_BCRYPT_ROUNDS = 4;
const MAX_BCRYPT_ROUNDS = 15;
const DEFAULT_BCRYPT_ROUNDS = 12;

let cached: AppConfig | null = null;

function required(env: NodeJS.ProcessEnv, name: string): string {
  const raw = env[name];
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/** Reads and validates the environment once; throws a descriptive Error when misconfigured. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const jwtSecret = required(env, 'JWT_SECRET');
  const internalApiKey = required(env, 'INTERNAL_API_KEY');
  const smsWebhookSecret = required(env, 'SMS_WEBHOOK_SECRET');

  const corsOrigins = required(env, 'CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (corsOrigins.length === 0) {
    throw new Error('CORS_ORIGINS must list at least one allowed origin');
  }
  if (corsOrigins.includes('*')) {
    throw new Error('CORS_ORIGINS must not contain the wildcard origin');
  }

  const roundsRaw = env.BCRYPT_ROUNDS?.trim();
  const bcryptRounds = roundsRaw ? Number(roundsRaw) : DEFAULT_BCRYPT_ROUNDS;
  if (!Number.isInteger(bcryptRounds) || bcryptRounds < MIN_BCRYPT_ROUNDS || bcryptRounds > MAX_BCRYPT_ROUNDS) {
    throw new Error(
      `BCRYPT_ROUNDS must be an integer between ${MIN_BCRYPT_ROUNDS} and ${MAX_BCRYPT_ROUNDS}`,
    );
  }

  return { jwtSecret, internalApiKey, smsWebhookSecret, corsOrigins, bcryptRounds };
}

/** Validated config, loaded once per process (fail fast at startup). */
export function getConfig(): AppConfig {
  if (!cached) cached = loadConfig();
  return cached;
}

/** Clears the cached config so tests can exercise loadConfig()/startup failures. */
export function resetConfigForTests(): void {
  cached = null;
}
