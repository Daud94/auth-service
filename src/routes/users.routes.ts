import express from 'express';
import * as users from '../controllers/users.controller';
import { authenticate } from '../middleware/auth';

/** Sign-up, login and profile for mobile app users. */
const router = express.Router();

router.post('/register', users.register);
router.post('/login', users.login);
router.get('/me', authenticate, users.me);
router
  .route('/me/avatar')
  .put(authenticate, users.updateAvatar)
  .delete(authenticate, users.removeAvatar);

export default router;
