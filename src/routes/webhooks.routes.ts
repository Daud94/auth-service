import crypto from 'crypto';
import { Router } from 'express';
import { getConfig } from '../config/env';

const router = Router();

/** Raw bytes of the request body (express.raw is mounted for this router). */
function rawBody(body: unknown): Buffer {
  if (Buffer.isBuffer(body)) return body;
  // Fallback for non-JSON content types: sign/verify whatever we actually got.
  return Buffer.from(typeof body === 'string' ? body : JSON.stringify(body ?? {}), 'utf8');
}

router.post('/sms-provider', (req, res) => {
  const signature = req.headers['x-sms-signature'];
  if (typeof signature !== 'string' || !signature) return res.status(401).end();

  const raw = rawBody(req.body);
  const expected = crypto.createHmac('sha256', getConfig().smsWebhookSecret).update(raw).digest('hex');

  const provided = Buffer.from(signature, 'utf8');
  const computed = Buffer.from(expected, 'utf8');
  if (provided.length !== computed.length || !crypto.timingSafeEqual(provided, computed)) {
    return res.status(401).end();
  }

  let payload: unknown = {};
  try {
    payload = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }

  res.json({ received: Boolean(payload) });
});

export default router;
