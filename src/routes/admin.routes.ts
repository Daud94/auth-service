import { Router } from 'express';
import * as users from '../controllers/users.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/users/:id', authenticate, requireRole('admin'), users.getById);
router.delete('/users/:id', authenticate, requireRole('admin'), users.remove);

export default router;
