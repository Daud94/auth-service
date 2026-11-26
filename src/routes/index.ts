import { Router } from 'express';
import adminRouter from './admin.routes';
import { internalRouter } from './internal.routes';
import usersRouter from './users.routes';
import webhooksRouter from './webhooks.routes';

const router = Router();

router.use('/mobile/users', usersRouter);
router.use('/admin', adminRouter);
router.use('/internal', internalRouter);
router.use('/webhooks', webhooksRouter);

export default router;
