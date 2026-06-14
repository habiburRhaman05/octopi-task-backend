import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '../types';
import {
  getOrganization,
  updateOrganization,
} from '../controllers/organizationController';
import { updateOrganizationSchema } from '../validation/organization';

const router = Router();

router.use(authenticate);

router.get('/', getOrganization);
router.patch(
  '/',
  requireRole(UserRole.ORG_ADMIN),
  validate({ body: updateOrganizationSchema }),
  updateOrganization
);

export default router;
