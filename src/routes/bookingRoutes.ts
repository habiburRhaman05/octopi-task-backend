import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  createBooking,
  listBookings,
  getBooking,
  updateBooking,
  cancelBooking,
} from '../controllers/bookingController';
import {
  createBookingSchema,
  updateBookingSchema,
  listBookingsQuerySchema,
} from '../validation/booking';
import { idParamSchema } from '../validation/common';

const router = Router();

router.use(authenticate);

// router.post('/', validate({ body: createBookingSchema }), createBooking);
router.get('/', validate({ query: listBookingsQuerySchema }), listBookings);
router.get('/:id', validate({ params: idParamSchema }), getBooking);
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateBookingSchema }),
  updateBooking
);
router.delete('/:id', validate({ params: idParamSchema }), cancelBooking);

export default router;
