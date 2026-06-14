import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '../types';
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import { createUserSchema, updateUserSchema } from '../validation/user';
import { idParamSchema } from '../validation/common';

const router = Router();

router.use(authenticate, requireRole(UserRole.ORG_ADMIN));

router.post('/', validate({ body: createUserSchema }), createUser);
router.get('/', listUsers);
router.get('/:id', validate({ params: idParamSchema }), getUser);
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateUserSchema }),
  updateUser
);
router.delete('/:id', validate({ params: idParamSchema }), deleteUser);

export default router;
