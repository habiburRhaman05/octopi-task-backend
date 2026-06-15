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

/**
 * @swagger
 * /organizations:
 *   get:
 *     tags: [Organizations]
 *     summary: Get current organization
 *     description: Returns the authenticated user's organization details including working hours and booking policy.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Organization'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.use(authenticate);

router.get('/', getOrganization);

/**
 * @swagger
 * /organizations:
 *   patch:
 *     tags: [Organizations]
 *     summary: Update organization settings
 *     description: Update the organization's name, timezone, working hours, or booking policy. Only accessible by ORG_ADMIN.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               timezone:
 *                 type: string
 *               workingHours:
 *                 $ref: '#/components/schemas/WorkingHours'
 *               bookingPolicy:
 *                 $ref: '#/components/schemas/BookingPolicy'
 *     responses:
 *       200:
 *         description: Organization updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Organization'
 *       400:
 *         description: Validation failed
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
 *         description: Insufficient permissions (ORG_ADMIN required)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  '/',
  requireRole(UserRole.ORG_ADMIN),
  validate({ body: updateOrganizationSchema }),
  updateOrganization
);

export default router;
