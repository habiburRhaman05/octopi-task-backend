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

/**
 * @swagger
 * /bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a new booking
 *     description: |
 *       Create a booking for a resource. Validates against the organization's booking policy:
 *       - Duration must be within minDuration and maxDuration
 *       - Must be within working hours on a working day
 *       - Must not exceed maxAdvanceBooking days
 *       - Must not conflict with existing bookings (including buffer time)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resourceId, startTime, endTime, title]
 *             properties:
 *               resourceId:
 *                 type: string
 *                 description: Resource MongoDB ObjectId
 *                 example: 6650a1b2c3d4e5f6a7b8c9d2
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: ISO 8601 start time
 *                 example: "2026-06-16T10:00:00-04:00"
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: ISO 8601 end time
 *                 example: "2026-06-16T11:00:00-04:00"
 *               title:
 *                 type: string
 *                 example: Team standup
 *               description:
 *                 type: string
 *                 example: Daily sync meeting
 *     responses:
 *       201:
 *         description: Booking created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Validation failed (duration, working hours, advance window)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Resource or organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Booking conflicts with an existing booking
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: object
 *                   properties:
 *                     conflictingBookingId:
 *                       type: string
 *                     conflictingWindow:
 *                       type: object
 *                       properties:
 *                         start:
 *                           type: string
 *                           format: date-time
 *                         end:
 *                           type: string
 *                           format: date-time
 */
router.use(authenticate);

router.post('/', validate({ body: createBookingSchema }), createBooking);

/**
 * @swagger
 * /bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: List bookings
 *     description: Returns a paginated list of bookings for the authenticated organization, optionally filtered by resource.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Results per page
 *       - in: query
 *         name: resourceId
 *         schema:
 *           type: string
 *         description: Filter by resource MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Paginated booking list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedBookings'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', validate({ query: listBookingsQuerySchema }), listBookings);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking by ID
 *     description: Returns a single booking by its ID within the organization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', validate({ params: idParamSchema }), getBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   patch:
 *     tags: [Bookings]
 *     summary: Update a booking
 *     description: |
 *       Update booking details. Only the booking owner or an ORG_ADMIN can update.
 *       If times change, re-validates against booking policy and checks for conflicts.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Validation failed or cannot update cancelled booking
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not the booking owner or admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Updated time conflicts with existing booking
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id', validate({ params: idParamSchema, body: updateBookingSchema }), updateBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     tags: [Bookings]
 *     summary: Cancel a booking
 *     description: |
 *       Cancel a booking by setting its status to CANCELLED. Only the booking owner or an ORG_ADMIN can cancel.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Booking cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not the booking owner or admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', validate({ params: idParamSchema }), cancelBooking);

export default router;
