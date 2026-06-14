import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { getAvailability } from '../controllers/availabilityController';
import { availabilityQuerySchema } from '../validation/availability';

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: availabilityQuerySchema }), getAvailability);

export default router;
