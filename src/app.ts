import cors, { type CorsOptions } from 'cors';
import express from 'express';
import { getConfig } from './config/env';
import apiRouter from './routes';

/** Strict allow-list: unknown browser origins are rejected, no wildcard, no credentials. */
function originAllowList(allowList: string[]): CorsOptions['origin'] {
  return (requestOrigin, callback) => {
    // Non-browser callers (curl, server-to-server) send no Origin header.
    if (!requestOrigin || allowList.includes(requestOrigin)) return callback(null, true);
    callback(new Error('Origin not allowed by CORS'));
  };
}

/** Builds the Express app (no listen, so tests can import it). */
export function createApp() {
  // Validate the environment before serving a single request.
  const config = getConfig();
  const app = express();

  app.use(
    cors({
      origin: originAllowList(config.corsOrigins),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-api-key', 'x-sms-signature'],
      maxAge: 600,
    }),
  );

  // Webhooks are signed over the raw bytes, so buffer those before (and instead
  // of) the global JSON parser.
  app.use('/api/v1/webhooks', express.raw({ type: 'application/json', limit: '1mb' }));
  app.use(express.json());

  app.use('/api/v1', apiRouter);
  app.get('/health', (_req, res) => res.json({ ok: true }));
  return app;
}
