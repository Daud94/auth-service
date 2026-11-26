import request from 'supertest';
import { createApp } from '../src/app';

describe('users API', () => {
  const app = createApp();

  it('registers without leaking credentials', async () => {
    const res = await request(app)
      .post('/api/v1/mobile/users/register')
      .send({ phone: '1', password: 'x' })
      .expect(201);
    expect(Object.keys(res.body)).toEqual(['id']);
  });

  it('logs in with a real token and reads the profile', async () => {
    await request(app).post('/api/v1/mobile/users/register').send({ phone: '2', password: 'pw' }).expect(201);

    const login = await request(app)
      .post('/api/v1/mobile/users/login')
      .send({ phone: '2', password: 'pw' })
      .expect(200);
    expect(typeof login.body.token).toBe('string');
    expect(login.body.token.split('.')).toHaveLength(3);

    const me = await request(app)
      .get('/api/v1/mobile/users/me')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);
    expect(me.body.phone).toBe('2');
    expect(me.body).not.toHaveProperty('password');
    expect(me.body).not.toHaveProperty('passwordHash');
  });

  it('rejects a wrong password', () =>
    request(app)
      .post('/api/v1/mobile/users/login')
      .send({ phone: '2', password: 'nope' })
      .expect(401));

  it('reads profile without a token', () => request(app).get('/api/v1/mobile/users/me').expect(401));
});
