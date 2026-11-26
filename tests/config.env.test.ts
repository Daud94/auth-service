import { loadConfig } from '../src/config/env';

const validEnv = () => ({
  JWT_SECRET: 'a-secret',
  INTERNAL_API_KEY: 'an-internal-key',
  SMS_WEBHOOK_SECRET: 'a-webhook-secret',
  CORS_ORIGINS: 'https://app.wayagram.ng, https://admin.wayagram.ng',
});

describe('loadConfig', () => {
  it('parses a valid environment', () => {
    const config = loadConfig(validEnv());
    expect(config.jwtSecret).toBe('a-secret');
    expect(config.internalApiKey).toBe('an-internal-key');
    expect(config.smsWebhookSecret).toBe('a-webhook-secret');
    expect(config.corsOrigins).toEqual(['https://app.wayagram.ng', 'https://admin.wayagram.ng']);
    expect(config.bcryptRounds).toBe(12);
  });

  it.each(['JWT_SECRET', 'INTERNAL_API_KEY', 'SMS_WEBHOOK_SECRET', 'CORS_ORIGINS'])(
    'throws when %s is missing',
    (name) => {
      const env: Record<string, string | undefined> = validEnv();
      delete env[name];
      expect(() => loadConfig(env)).toThrow(name);
    },
  );

  it.each(['JWT_SECRET', 'INTERNAL_API_KEY', 'SMS_WEBHOOK_SECRET', 'CORS_ORIGINS'])(
    'throws when %s is blank',
    (name) => {
      const env = { ...validEnv(), [name]: '   ' };
      expect(() => loadConfig(env)).toThrow(name);
    },
  );

  it('rejects a wildcard CORS origin', () => {
    expect(() => loadConfig({ ...validEnv(), CORS_ORIGINS: '*' })).toThrow(/wildcard/);
  });

  it('rejects invalid bcrypt rounds', () => {
    expect(() => loadConfig({ ...validEnv(), BCRYPT_ROUNDS: 'abc' })).toThrow(/BCRYPT_ROUNDS/);
    expect(() => loadConfig({ ...validEnv(), BCRYPT_ROUNDS: '2' })).toThrow(/BCRYPT_ROUNDS/);
  });
});
