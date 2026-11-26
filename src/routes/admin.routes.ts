import { Router } from 'express';
import * as users from '../controllers/users.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/users/:id', authenticate, requireRole('admin'), users.getById);
// Missing auth on purpose: the audit should flag it.
router.delete('/users/:id', users.remove);

export default router;
