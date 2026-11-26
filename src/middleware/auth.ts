import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getConfig } from '../config/env';

export type AuthenticatedUser = { sub: string; role: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header !== 'string') return null;
  const [scheme, ...rest] = header.split(' ');
  if (scheme !== 'Bearer') return null;
  const token = rest.join(' ').trim();
  return token || null;
}

/** Constant-time string comparison that never leaks the secret length. */
export function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = bearerToken(req);
  if (!token) return res.status(401).end();

  try {
    const payload = jwt.verify(token, getConfig().jwtSecret);
    if (typeof payload === 'string' || !payload.sub) return res.status(401).end();
    const role: string = typeof payload.role === 'string' ? payload.role : 'user';
    req.user = { sub: String(payload.sub), role };
    next();
  } catch {
    res.status(401).end();
  }
}

export const requireRole =
  (role: string) => (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).end();
    if (req.user.role !== role) return res.status(403).end();
    next();
  };

export function serviceAuth(req: Request, res: Response, next: NextFunction) {
  const provided = req.headers['x-internal-api-key'];
  let expected: string;
  try {
    expected = getConfig().internalApiKey;
  } catch {
    // Never fall back to "no key configured == open door".
    return res.status(500).end();
  }
  if (typeof provided !== 'string' || !safeCompare(provided, expected)) return res.status(401).end();
  next();
}
