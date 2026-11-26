import cors from 'cors';
import express from 'express';
import apiRouter from './routes';

/** Builds the Express app (no listen, so tests can import it). */
export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/v1', apiRouter);
  app.get('/health', (_req, res) => res.json({ ok: true }));
  return app;
}
