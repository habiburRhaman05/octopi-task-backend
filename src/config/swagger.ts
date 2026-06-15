import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Multi-Tenant Booking System API',
      version: '1.0.0',
      description:
        'RESTful API for managing resource bookings across multiple organizations with JWT authentication, role-based access control, availability checking, and conflict detection.',
      contact: {
        name: 'API Support',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        // ── Working Hours ──────────────────────────────────
        WorkingHours: {
          type: 'object',
          required: ['start', 'end', 'daysOfWeek'],
          properties: {
            start: {
              type: 'string',
              example: '09:00',
              description: 'Daily opening time in HH:mm format (org timezone)',
            },
            end: {
              type: 'string',
              example: '17:00',
              description: 'Daily closing time in HH:mm format (org timezone)',
            },
            daysOfWeek: {
              type: 'array',
              items: { type: 'integer', minimum: 1, maximum: 7 },
              example: [1, 2, 3, 4, 5],
              description: 'ISO weekday numbers (1=Mon … 7=Sun)',
            },
          },
        },
        // ── Booking Policy ─────────────────────────────────
        BookingPolicy: {
          type: 'object',
          required: ['minDuration', 'maxDuration', 'bufferTime', 'maxAdvanceBooking'],
          properties: {
            minDuration: {
              type: 'integer',
              minimum: 1,
              example: 15,
              description: 'Minimum booking length in minutes',
            },
            maxDuration: {
              type: 'integer',
              minimum: 1,
              example: 480,
              description: 'Maximum booking length in minutes',
            },
            bufferTime: {
              type: 'integer',
              minimum: 0,
              example: 10,
              description: 'Default buffer in minutes before/after bookings',
            },
            maxAdvanceBooking: {
              type: 'integer',
              minimum: 1,
              example: 30,
              description: 'How many days ahead a booking can be made',
            },
          },
        },
        // ── Organization ───────────────────────────────────
        Organization: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            name: { type: 'string', example: 'Acme Corp' },
            timezone: { type: 'string', example: 'America/New_York' },
            workingHours: { $ref: '#/components/schemas/WorkingHours' },
            bookingPolicy: { $ref: '#/components/schemas/BookingPolicy' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── User ───────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d1' },
            organizationId: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            email: { type: 'string', format: 'email', example: 'john@acme.com' },
            role: { type: 'string', enum: ['ORG_ADMIN', 'EMPLOYEE'], example: 'EMPLOYEE' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            isDeleted: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Resource ───────────────────────────────────────
        Resource: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d2' },
            organizationId: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            name: { type: 'string', example: 'Conference Room A' },
            type: { type: 'string', example: 'meeting-room' },
            capacity: { type: 'integer', example: 8 },
            bufferTime: { type: 'integer', example: 10 },
            isDeleted: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Booking ────────────────────────────────────────
        Booking: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d3' },
            organizationId: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            resourceId: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d2' },
            userId: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d1' },
            title: { type: 'string', example: 'Team standup' },
            description: { type: 'string', example: 'Daily sync' },
            startTime: { type: 'string', format: 'date-time', example: '2026-06-16T14:00:00.000Z' },
            endTime: { type: 'string', format: 'date-time', example: '2026-06-16T15:00:00.000Z' },
            bufferStartTime: { type: 'string', format: 'date-time' },
            bufferEndTime: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['CONFIRMED', 'CANCELLED'], example: 'CONFIRMED' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Availability Slot ──────────────────────────────
        AvailabilitySlot: {
          type: 'object',
          properties: {
            startTime: { type: 'string', example: '2026-06-16T09:00:00.000-04:00' },
            endTime: { type: 'string', example: '2026-06-16T10:00:00.000-04:00' },
          },
        },
        // ── Register Input ─────────────────────────────────
        RegisterInput: {
          type: 'object',
          required: ['organization', 'admin'],
          properties: {
            organization: {
              type: 'object',
              required: ['name', 'timezone', 'workingHours', 'bookingPolicy'],
              properties: {
                name: { type: 'string', example: 'Acme Corp' },
                timezone: { type: 'string', example: 'America/New_York' },
                workingHours: { $ref: '#/components/schemas/WorkingHours' },
                bookingPolicy: { $ref: '#/components/schemas/BookingPolicy' },
              },
            },
            admin: {
              type: 'object',
              required: ['email', 'password', 'firstName', 'lastName'],
              properties: {
                email: { type: 'string', format: 'email', example: 'admin@acme.com' },
                password: { type: 'string', minLength: 8, example: 'securepass123' },
                firstName: { type: 'string', example: 'Jane' },
                lastName: { type: 'string', example: 'Smith' },
              },
            },
          },
        },
        // ── Login Input ────────────────────────────────────
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@acme.com' },
            password: { type: 'string', example: 'securepass123' },
          },
        },
        // ── Refresh Input ──────────────────────────────────
        RefreshInput: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
          },
        },
        // ── Token Pair ─────────────────────────────────────
        TokenPair: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
          },
        },
        // ── Error ──────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Validation failed' },
            details: { type: 'object' },
          },
        },
        // ── Paginated Bookings ─────────────────────────────
        PaginatedBookings: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Booking' },
            },
            total: { type: 'integer', example: 42 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
          },
        },
      },
    },
    security: [],
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Auth', description: 'Authentication & registration' },
      { name: 'Organizations', description: 'Organization management (admin only for updates)' },
      { name: 'Users', description: 'User management (admin only)' },
      { name: 'Resources', description: 'Bookable resource management' },
      { name: 'Bookings', description: 'Booking creation and management' },
      { name: 'Availability', description: 'Available time slot queries' },
    ],
  },
 apis: ['src/routes/**/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
