import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  register,
  login,
  profile,
  refresh,
} from '../controllers/authController';
import { registerSchema, loginSchema, refreshSchema } from '../validation/auth';

const router = Router();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);
router.post('/refresh', validate({ body: refreshSchema }), refresh);
router.get('/profile', authenticate, profile);

export default router;
