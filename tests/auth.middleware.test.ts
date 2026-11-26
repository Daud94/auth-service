import type { NextFunction, Request, Response } from 'express';
import type { SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { getConfig, resetConfigForTests } from '../src/config/env';
import { authenticate, requireRole, serviceAuth } from '../src/middleware/auth';

function mockRes() {
  const res = {
    statusCode: 0,
    ended: false,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    end() {
      res.ended = true;
      return res;
    },
  };
  return res as unknown as Response & { statusCode: number; ended: boolean };
}

const run = (
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  req: Partial<Request>,
) => {
  const res = mockRes();
  const next = jest.fn();
  middleware(req as Request, res, next);
  return { res, next };
};

const sign = (payload: Record<string, unknown>, options: SignOptions = {}) =>
  jwt.sign(payload, getConfig().jwtSecret, { expiresIn: '15m', ...options });

describe('authenticate', () => {
  it('returns 401 without an Authorization header', () => {
    const { res, next } = run(authenticate, { headers: {} });
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a malformed token', () => {
    const { res, next } = run(authenticate, { headers: { authorization: 'Bearer not-a-token' } });
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an expired token', () => {
    const expired = jwt.sign({ sub: '1', role: 'admin' }, getConfig().jwtSecret, { expiresIn: '-1s' });
    const { res, next } = run(authenticate, { headers: { authorization: `Bearer ${expired}` } });
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a token signed with another secret', () => {
    const forged = jwt.sign({ sub: '1', role: 'admin' }, 'some-other-secret');
    const { res, next } = run(authenticate, { headers: { authorization: `Bearer ${forged}` } });
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('populates req.user for a valid token', () => {
    const req: Partial<Request> = { headers: { authorization: `Bearer ${sign({ sub: '42', role: 'admin' })}` } };
    const { res, next } = run(authenticate, req);
    expect(res.statusCode).toBe(0);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ sub: '42', role: 'admin' });
  });
});

describe('requireRole', () => {
  it('returns 401 when no user is attached', () => {
    const { res, next } = run(requireRole('admin'), {});
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for a non-admin role', () => {
    const { res, next } = run(requireRole('admin'), { user: { sub: '1', role: 'user' } });
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() for the required role', () => {
    const { next } = run(requireRole('admin'), { user: { sub: '1', role: 'admin' } });
    expect(next).toHaveBeenCalled();
  });
});

describe('serviceAuth', () => {
  it('returns 401 when the header is missing', () => {
    const { res, next } = run(serviceAuth, { headers: {} });
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the key mismatches', () => {
    const { res, next } = run(serviceAuth, { headers: { 'x-internal-api-key': 'wrong' } });
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() for the configured key', () => {
    const { next } = run(serviceAuth, {
      headers: { 'x-internal-api-key': getConfig().internalApiKey },
    });
    expect(next).toHaveBeenCalled();
  });

  it('never bypasses when INTERNAL_API_KEY is unset', () => {
    const original = process.env.INTERNAL_API_KEY;
    delete process.env.INTERNAL_API_KEY;
    resetConfigForTests();
    try {
      const { res, next } = run(serviceAuth, { headers: { 'x-internal-api-key': 'undefined' } });
      expect(res.statusCode).toBe(500);
      expect(next).not.toHaveBeenCalled();
    } finally {
      process.env.INTERNAL_API_KEY = original;
      resetConfigForTests();
    }
  });
});
