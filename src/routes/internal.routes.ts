import { Router } from 'express';
import * as users from '../controllers/users.controller';
import { serviceAuth } from '../middleware/auth';

export const internalRouter = Router();

internalRouter.use(serviceAuth);
internalRouter.get('/users/:id', users.getById);
