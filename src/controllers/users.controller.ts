import type { Request, Response } from 'express';
import { usersService } from '../services/users.service';

function credentials(body: unknown): { phone: string; password: string } | null {
  const { phone, password } = (body ?? {}) as { phone?: unknown; password?: unknown };
  if (typeof phone !== 'string' || !phone || typeof password !== 'string' || !password) return null;
  return { phone, password };
}

export async function register(req: Request, res: Response) {
  const input = credentials(req.body);
  if (!input) return res.status(400).json({ error: 'phone and password are required' });
  try {
    const { id } = await usersService.register(input.phone, input.password);
    res.status(201).json({ id });
  } catch {
    res.status(500).end();
  }
}

export async function login(req: Request, res: Response) {
  const input = credentials(req.body);
  if (!input) return res.status(401).end();
  try {
    const result = await usersService.login(input.phone, input.password);
    if (!result) return res.status(401).end();
    res.json(result);
  } catch {
    res.status(500).end();
  }
}

export function me(req: Request, res: Response) {
  const id = req.user?.sub;
  const user = id ? usersService.findById(id) : null;
  if (!user) return res.status(404).end();
  res.json(user);
}

export function updateAvatar(_req: Request, res: Response) {
  res.json({ ok: true });
}

export function removeAvatar(_req: Request, res: Response) {
  res.status(204).end();
}

export function getById(req: Request, res: Response) {
  const user = usersService.findById(req.params.id);
  if (!user) return res.status(404).end();
  res.json(user);
}

export function remove(req: Request, res: Response) {
  if (!usersService.remove(req.params.id)) return res.status(404).end();
  res.status(204).end();
}
