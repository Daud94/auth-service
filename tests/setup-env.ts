// Seeds the env vars the app validates at startup so tests never boot unset.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-do-not-use-in-production';
process.env.INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'test-internal-api-key';
process.env.SMS_WEBHOOK_SECRET = process.env.SMS_WEBHOOK_SECRET || 'test-sms-webhook-secret';
process.env.CORS_ORIGINS =
  process.env.CORS_ORIGINS || 'https://app.wayagram.ng,https://admin.wayagram.ng';
// Keep bcrypt cheap in tests.
process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS || '4';
