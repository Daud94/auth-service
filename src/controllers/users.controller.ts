import type { Request, Response } from 'express';
import { usersService } from '../services/users.service';

export function register(req: Request, res: Response) {
  res.status(201).json(usersService.register(req.body.phone, req.body.password));
}

export function login(req: Request, res: Response) {
  const result = usersService.login(req.body.phone, req.body.password);
  if (!result) return res.status(401).end();
  res.json(result);
}

export function me(_req: Request, res: Response) {
  res.json({});
}

export function updateAvatar(_req: Request, res: Response) {
  res.json({ ok: true });
}

export function removeAvatar(_req: Request, res: Response) {
  res.status(204).end();
}

export function getById(req: Request, res: Response) {
  res.json(usersService.findById(req.params.id));
}

export function remove(req: Request, res: Response) {
  res.json({ deleted: req.params.id });
}
