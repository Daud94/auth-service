import request from 'supertest';
import { createApp } from '../src/app';

describe('users API', () => {
  const app = createApp();
  it('registers', () => request(app).post('/api/v1/mobile/users/register').send({ phone: '1', password: 'x' }).expect(201));
  it('logs in', () => request(app).post('/api/v1/mobile/users/login').send({ phone: '1', password: 'x' }).expect(200));
  it('reads profile', () => request(app).get('/api/v1/mobile/users/me').expect(401));
});
