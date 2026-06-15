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

/**
 * @swagger
 * /resources:
 *   get:
 *     tags: [Resources]
 *     summary: List all resources
 *     description: Returns all non-deleted resources in the authenticated organization.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of resources
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Resource'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.use(authenticate);

router.get('/', listResources);

/**
 * @swagger
 * /resources/{id}:
 *   get:
 *     tags: [Resources]
 *     summary: Get resource by ID
 *     description: Returns a single resource by its ID within the organization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Resource details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Resource'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', validate({ params: idParamSchema }), getResource);

/**
 * @swagger
 * /resources:
 *   post:
 *     tags: [Resources]
 *     summary: Create a new resource
 *     description: Create a new bookable resource within the organization. Only accessible by ORG_ADMIN.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Conference Room A
 *               type:
 *                 type: string
 *                 example: meeting-room
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 example: 8
 *               bufferTime:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 example: 10
 *                 description: Buffer minutes before/after bookings
 *     responses:
 *       201:
 *         description: Resource created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Resource'
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
 *       409:
 *         description: Resource with this name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  requireRole(UserRole.ORG_ADMIN),
  validate({ body: createResourceSchema }),
  createResource
);

/**
 * @swagger
 * /resources/{id}:
 *   patch:
 *     tags: [Resources]
 *     summary: Update a resource
 *     description: Update resource details. Only accessible by ORG_ADMIN.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *               bufferTime:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Resource updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Resource'
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
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  '/:id',
  requireRole(UserRole.ORG_ADMIN),
  validate({ params: idParamSchema, body: updateResourceSchema }),
  updateResource
);

/**
 * @swagger
 * /resources/{id}:
 *   delete:
 *     tags: [Resources]
 *     summary: Soft-delete a resource
 *     description: Marks a resource as deleted. Only accessible by ORG_ADMIN.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource MongoDB ObjectId
 *     responses:
 *       204:
 *         description: Resource deleted
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  requireRole(UserRole.ORG_ADMIN),
  validate({ params: idParamSchema }),
  deleteResource
);

export default router;
