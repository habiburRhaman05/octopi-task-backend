import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '../types';
import {
  createResource,
  listResources,
  getResource,
  updateResource,
  deleteResource,
} from '../controllers/resourceController';
import {
  createResourceSchema,
  updateResourceSchema,
} from '../validation/resource';
import { idParamSchema } from '../validation/common';

const router = Router();

router.use(authenticate);

router.get('/', listResources);
router.get('/:id', validate({ params: idParamSchema }), getResource);

router.post(
  '/',
  requireRole(UserRole.ORG_ADMIN),
  validate({ body: createResourceSchema }),
  createResource
);
router.patch(
  '/:id',
  requireRole(UserRole.ORG_ADMIN),
  validate({ params: idParamSchema, body: updateResourceSchema }),
  updateResource
);
router.delete(
  '/:id',
  requireRole(UserRole.ORG_ADMIN),
  validate({ params: idParamSchema }),
  deleteResource
);

export default router;
