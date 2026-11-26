import { Router } from 'express';

const router = Router();

router.post('/sms-provider', (req, res) => {
  res.json({ received: Boolean(req.body) });
});

export default router;
