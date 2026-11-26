import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getConfig } from '../config/env';

type User = {
  id: string;
  phone: string;
  passwordHash: string;
  role: string;
  status: string;
  createdAt: string;
};

/** Never contains credentials. */
export type PublicUserDto = { id: string; phone: string };

/** Admin/internal safe projection: no credentials are ever serialized. */
export type AdminUserDto = { id: string; phone: string; status: string; createdAt: string };

const TOKEN_TTL = '15m';

export function toPublicDto(user: User): PublicUserDto {
  return { id: user.id, phone: user.phone };
}

export function toAdminDto(user: User): AdminUserDto {
  return { id: user.id, phone: user.phone, status: user.status, createdAt: user.createdAt };
}

class UsersService {
  private users = new Map<string, User>();

  private nextId = 1;

  /** Test helper: forget every stored user. */
  reset() {
    this.users.clear();
    this.nextId = 1;
  }

  async register(phone: string, password: string) {
    const id = String(this.nextId++);
    const passwordHash = await bcrypt.hash(password, getConfig().bcryptRounds);
    this.users.set(id, {
      id,
      phone,
      passwordHash,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    return { id };
  }

  async login(phone: string, password: string) {
    const user = [...this.users.values()].find((u) => u.phone === phone);
    if (!user) return null;
    if (!(await bcrypt.compare(password, user.passwordHash))) return null;

    const token = jwt.sign({ sub: user.id, role: user.role }, getConfig().jwtSecret, {
      expiresIn: TOKEN_TTL,
    });
    return { token, user: toPublicDto(user) };
  }

  findById(id: string): AdminUserDto | null {
    const user = this.users.get(id);
    return user ? toAdminDto(user) : null;
  }

  /** Mutates the store; returns false when the id is unknown. */
  remove(id: string): boolean {
    return this.users.delete(id);
  }
}

export const usersService = new UsersService();
