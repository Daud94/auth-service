import bcrypt from 'bcrypt';
import type { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { getConfig } from '../src/config/env';
import { usersService } from '../src/services/users.service';

describe('usersService', () => {
  beforeEach(() => usersService.reset());

  it('registers and finds a user by id', async () => {
    const { id } = await usersService.register('080', 'pw');
    expect(usersService.findById(id)?.phone).toBe('080');
  });

  it('stores a bcrypt hash, never the plaintext', async () => {
    const { id } = await usersService.register('0801', 'hunter2');
    expect(JSON.stringify(usersService.findById(id))).not.toContain('hunter2');

    const stored = (usersService as unknown as { users: Map<string, { passwordHash: string }> }).users.get(id);
    expect(stored?.passwordHash).toBeDefined();
    expect(stored?.passwordHash).not.toBe('hunter2');
    await expect(bcrypt.compare('hunter2', stored!.passwordHash)).resolves.toBe(true);
  });

  it('never exposes credential fields from findById or login', async () => {
    const { id } = await usersService.register('0802', 'pw');
    expect(Object.keys(usersService.findById(id) ?? {})).not.toContain('passwordHash');
    expect(Object.keys(usersService.findById(id) ?? {})).not.toContain('password');

    const result = await usersService.login('0802', 'pw');
    expect(result).not.toBeNull();
    expect(Object.keys(result!.user)).not.toContain('passwordHash');
    expect(Object.keys(result!.user)).not.toContain('password');
  });

  it('logs in with the correct password and rejects a wrong one', async () => {
    await usersService.register('0803', 'correct-horse');
    await expect(usersService.login('0803', 'wrong')).resolves.toBeNull();
    await expect(usersService.login('unknown', 'correct-horse')).resolves.toBeNull();
    await expect(usersService.login('0803', 'correct-horse')).resolves.not.toBeNull();
  });

  it('issues a JWT the auth middleware can consume', async () => {
    const { id } = await usersService.register('0804', 'pw');
    const result = await usersService.login('0804', 'pw');
    const payload = jwt.verify(result!.token, getConfig().jwtSecret) as JwtPayload;

    expect(payload.sub).toBe(id);
    expect(payload.role).toBe('user');
    expect(payload.exp! - payload.iat!).toBe(15 * 60);
  });

  it('removes users and reports whether they existed', async () => {
    const { id } = await usersService.register('0805', 'pw');
    expect(usersService.remove(id)).toBe(true);
    expect(usersService.findById(id)).toBeNull();
    expect(usersService.remove(id)).toBe(false);
  });
});
