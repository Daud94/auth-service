import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../src/app';
import { getConfig } from '../src/config/env';
import { usersService } from '../src/services/users.service';

const app = createApp();

const token = (payload: Record<string, unknown>) =>
  jwt.sign(payload, getConfig().jwtSecret, { expiresIn: '15m' });

describe('DELETE /api/v1/admin/users/:id', () => {
  beforeEach(() => usersService.reset());

  it('returns 401 without a token', () =>
    request(app).delete('/api/v1/admin/users/1').expect(401));

  it('returns 403 for a non-admin token', async () => {
    const { id } = await usersService.register('080', 'pw');
    await request(app)
      .delete(`/api/v1/admin/users/${id}`)
      .set('Authorization', `Bearer ${token({ sub: '1', role: 'user' })}`)
      .expect(403);
    expect(usersService.findById(id)).not.toBeNull();
  });

  it('returns 204 when an admin deletes an existing user', async () => {
    const { id } = await usersService.register('081', 'pw');
    await request(app)
      .delete(`/api/v1/admin/users/${id}`)
      .set('Authorization', `Bearer ${token({ sub: '9', role: 'admin' })}`)
      .expect(204);
    expect(usersService.findById(id)).toBeNull();
  });

  it('returns 404 for an unknown id', () =>
    request(app)
      .delete('/api/v1/admin/users/unknown')
      .set('Authorization', `Bearer ${token({ sub: '9', role: 'admin' })}`)
      .expect(404));
});

describe('GET /api/v1/admin/users/:id', () => {
  beforeEach(() => usersService.reset());

  it('never serializes credentials', async () => {
    const { id } = await usersService.register('082', 'pw');
    const res = await request(app)
      .get(`/api/v1/admin/users/${id}`)
      .set('Authorization', `Bearer ${token({ sub: '9', role: 'admin' })}`)
      .expect(200);
    expect(res.body).toEqual({ id, phone: '082', status: 'active', createdAt: expect.any(String) });
  });

  it('returns 404 for an unknown id', () =>
    request(app)
      .get('/api/v1/admin/users/nope')
      .set('Authorization', `Bearer ${token({ sub: '9', role: 'admin' })}`)
      .expect(404));
});

describe('GET /api/v1/internal/users/:id', () => {
  beforeEach(() => usersService.reset());

  it('requires the internal API key', () => request(app).get('/api/v1/internal/users/1').expect(401));

  it('rejects a wrong key', () =>
    request(app).get('/api/v1/internal/users/1').set('x-internal-api-key', 'wrong').expect(401));

  it('returns the safe user projection', async () => {
    const { id } = await usersService.register('083', 'pw');
    const res = await request(app)
      .get(`/api/v1/internal/users/${id}`)
      .set('x-internal-api-key', getConfig().internalApiKey)
      .expect(200);
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body).not.toHaveProperty('password');
  });
});

describe('POST /api/v1/webhooks/sms-provider', () => {
  const rawBody = JSON.stringify({ from: '+2348000000000', text: 'hi' });
  const sign = (body: string) =>
    crypto.createHmac('sha256', getConfig().smsWebhookSecret).update(Buffer.from(body, 'utf8')).digest('hex');

  const post = (body: string, signature?: string) => {
    const req = request(app).post('/api/v1/webhooks/sms-provider').set('Content-Type', 'application/json');
    if (signature !== undefined) req.set('x-sms-signature', signature);
    return req.send(body);
  };

  it('returns 401 without a signature', () => post(rawBody).expect(401));

  it('returns 401 for a tampered signature', () => post(rawBody, sign('other')).expect(401));

  it('returns 401 when the body is tampered with', () => post('{"from":"evil"}', sign(rawBody)).expect(401));

  it('accepts a correctly signed payload', async () => {
    const res = await post(rawBody, sign(rawBody)).expect(200);
    expect(res.body).toEqual({ received: true });
  });
});

describe('CORS', () => {
  it('omits the allow-origin header for unknown origins', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows a configured origin', async () => {
    const res = await request(app).get('/health').set('Origin', getConfig().corsOrigins[0]).expect(200);
    expect(res.headers['access-control-allow-origin']).toBe(getConfig().corsOrigins[0]);
  });
});
