import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { getAvailability } from '../controllers/availabilityController';
import { availabilityQuerySchema } from '../validation/availability';

const router = Router();

/**
 * @swagger
 * /availability:
 *   get:
 *     tags: [Availability]
 *     summary: Get available time slots
 *     description: |
 *       Returns available time slots for a resource within a date range. The engine:
 *       - Validates duration against the org's minDuration/maxDuration
 *       - Skips non-working days and hours
 *       - Excludes slots that conflict with existing bookings (including buffer time)
 *       - Only returns slots in the future
 *       - Steps through time in SLOT_GRANULARITY_MINUTES increments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource MongoDB ObjectId
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: "Start date (e.g. 2026-06-16)"
 *         example: "2026-06-16"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: "End date (e.g. 2026-06-20)"
 *         example: "2026-06-20"
 *       - in: query
 *         name: duration
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Desired slot duration in minutes
 *         example: 60
 *     responses:
 *       200:
 *         description: Available time slots
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceId:
 *                   type: string
 *                 duration:
 *                   type: integer
 *                 count:
 *                   type: integer
 *                 slots:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AvailabilitySlot'
 *       400:
 *         description: Validation failed (invalid dates, duration out of range)
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
 */
router.use(authenticate);

router.get('/', validate({ query: availabilityQuerySchema }), getAvailability);

export default router;
