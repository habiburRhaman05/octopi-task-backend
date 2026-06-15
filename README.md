# Multi-Tenant Booking System

A RESTful API for managing resource bookings across multiple organizations. Built with TypeScript, Express 5, MongoDB, and Zod validation.

---


---

## Features

- **Multi-Tenant Architecture** — Organization-scoped data isolation for all resources, users, and bookings
- **Role-Based Access Control** — `ORG_ADMIN` and `EMPLOYEE` roles with granular route permissions
- **JWT Authentication** — Access/refresh token pair with configurable expiry
- **Availability Engine** — Time-slot generation that respects working hours, existing bookings, buffer times, and booking policies
- **Conflict Detection** — Automatic overlap checking when creating or updating bookings
- **Timezone Handling** — Full IANA timezone support via Luxon; all times normalized to UTC internally
- **Input Validation** — Zod schemas for every request body, query, and params
- **Soft Deletes** — Resources and users are soft-deleted to preserve data integrity
- **Graceful Shutdown** — SIGINT/SIGTERM handlers drain connections and disconnect MongoDB cleanly

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (v18+) |
| Language | TypeScript 6 (strict mode) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 9 |
| Validation | Zod 4 |
| Auth | JWT (`jsonwebtoken`) + bcrypt (12 salt rounds) |
| Timezone | Luxon |
| Dev Tools | nodemon, ts-node, Jest |

---

## Getting Started

### Prerequisites

- Node.js v18 or later
- MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd multi-tenant-booking-system

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
# Edit .env with your configuration (see Environment Variables below)

# Start development server
npm run dev
```

The server starts at `http://localhost:3000` by default.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload (nodemon + ts-node) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled JavaScript from `dist/` |
| `npm run typecheck` | Type-check without emitting files |

---

## Environment Variables

Create a `.env` file in the project root. See [`.env.example`](.env.example) for a template.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | `development`, `test`, or `production` |
| `PORT` | No | `3000` | Server listen port |
| `DATABASE_URL` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | **Yes** | — | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token TTL (e.g. `15m`, `1h`) |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token TTL (e.g. `7d`, `30d`) |
| `SLOT_GRANULARITY_MINUTES` | No | `30` | Availability slot step size in minutes |

All environment variables are validated at startup using Zod. The server will refuse to start if required variables are missing or have invalid types.

---

## Quick Start Workflow

This walkthrough takes you from zero to your first booking.

### 1. Register an Organization + Admin

```bash
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organization": {
      "name": "Acme Corp",
      "timezone": "America/New_York",
      "workingHours": {
        "start": "09:00",
        "end": "17:00",
        "daysOfWeek": [1, 2, 3, 4, 5]
      },
      "bookingPolicy": {
        "minDuration": 15,
        "maxDuration": 480,
        "bufferTime": 10,
        "maxAdvanceBooking": 30
      }
    },
    "admin": {
      "email": "admin@acme.com",
      "password": "securepass123",
      "firstName": "Jane",
      "lastName": "Smith"
    }
  }'
```

Save the `accessToken` from the response — you'll need it for all subsequent requests.

### 2. Create a Resource

```bash
curl -s -X POST http://localhost:3000/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "name": "Conference Room A",
    "type": "meeting-room",
    "capacity": 8,
    "bufferTime": 10
  }'
```

### 3. Create an Employee

```bash
curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "email": "john@acme.com",
    "password": "securepass123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE"
  }'
```

### 4. Check Availability

```bash
curl -s "http://localhost:3000/availability?resourceId=<RESOURCE_ID>&startDate=2026-06-16&endDate=2026-06-20&duration=60" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 5. Book a Slot

```bash
curl -s -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "resourceId": "<RESOURCE_ID>",
    "startTime": "2026-06-16T10:00:00-04:00",
    "endTime": "2026-06-16T11:00:00-04:00",
    "title": "Team standup",
    "description": "Daily sync"
  }'
```

### 6. Refresh Your Token

```bash
curl -s -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "<REFRESH_TOKEN>" }'
```

---

## API Endpoints

All endpoints return JSON. Protected routes require a `Bearer <token>` `Authorization` header.

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Returns `{ status: "ok", timestamp }` |

```bash
curl http://localhost:3000/health
# → { "status": "ok", "timestamp": "2026-06-15T12:00:00.000Z" }
```

---

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | No | Register an organization + admin user |
| `POST` | `/auth/login` | No | Login and receive tokens |
| `POST` | `/auth/refresh` | No | Exchange refresh token for new token pair |
| `GET` | `/auth/profile` | Yes | Get current user profile |

#### `POST /auth/register`

Register a new organization and its first admin user.

**Request body:**

```json
{
  "organization": {
    "name": "Acme Corp",
    "timezone": "America/New_York",
    "workingHours": {
      "start": "09:00",
      "end": "17:00",
      "daysOfWeek": [1, 2, 3, 4, 5]
    },
    "bookingPolicy": {
      "minDuration": 15,
      "maxDuration": 480,
      "bufferTime": 10,
      "maxAdvanceBooking": 30
    }
  },
  "admin": {
    "email": "admin@acme.com",
    "password": "securepass123",
    "firstName": "Jane",
    "lastName": "Smith"
  }
}
```

**Response (`201`):**

```json
{
  "organization": { "id": "6650a1b2c3d4e5f6a7b8c9d0", "name": "Acme Corp" },
  "user": {
    "id": "6650a1b2c3d4e5f6a7b8c9d1",
    "email": "admin@acme.com",
    "role": "ORG_ADMIN",
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

```bash
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organization": {
      "name": "Acme Corp",
      "timezone": "America/New_York",
      "workingHours": { "start": "09:00", "end": "17:00", "daysOfWeek": [1,2,3,4,5] },
      "bookingPolicy": { "minDuration": 15, "maxDuration": 480, "bufferTime": 10, "maxAdvanceBooking": 30 }
    },
    "admin": { "email": "admin@acme.com", "password": "securepass123", "firstName": "Jane", "lastName": "Smith" }
  }'
```

#### `POST /auth/login`

**Request body:**

```json
{ "email": "admin@acme.com", "password": "securepass123" }
```

**Response (`200`):**

```json
{
  "user": {
    "id": "6650a1b2c3d4e5f6a7b8c9d1",
    "email": "admin@acme.com",
    "role": "ORG_ADMIN",
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@acme.com", "password": "securepass123" }'
```

#### `POST /auth/refresh`

**Request body:**

```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiIs..." }
```

**Response (`200`):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

```bash
curl -s -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "<REFRESH_TOKEN>" }'
```

#### `GET /auth/profile`

```bash
curl -s http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Response (`200`):**

```json
{
  "id": "6650a1b2c3d4e5f6a7b8c9d1",
  "email": "admin@acme.com",
  "role": "ORG_ADMIN",
  "firstName": "Jane",
  "lastName": "Smith",
  "organizationId": "6650a1b2c3d4e5f6a7b8c9d0"
}
```

---

### Organization

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/organizations` | Yes | Any | Get current organization details |
| `PATCH` | `/organizations` | Yes | ORG_ADMIN | Update organization settings |

#### `GET /organizations`

```bash
curl -s http://localhost:3000/organizations \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### `PATCH /organizations`

```bash
curl -s -X PATCH http://localhost:3000/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{ "bookingPolicy": { "minDuration": 30, "maxDuration": 480, "bufferTime": 15, "maxAdvanceBooking": 60 } }'
```

---

### Users

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `POST` | `/users` | Yes | ORG_ADMIN | Create a new user |
| `GET` | `/users` | Yes | ORG_ADMIN | List all users in organization |
| `GET` | `/users/:id` | Yes | ORG_ADMIN | Get user by ID |
| `PATCH` | `/users/:id` | Yes | ORG_ADMIN | Update a user |
| `DELETE` | `/users/:id` | Yes | ORG_ADMIN | Soft-delete a user |

#### `POST /users`

```bash
curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "email": "john@acme.com",
    "password": "securepass123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE"
  }'
```

#### `GET /users`

```bash
curl -s http://localhost:3000/users \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### `GET /users/:id`

```bash
curl -s http://localhost:3000/users/6650a1b2c3d4e5f6a7b8c9d1 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### `PATCH /users/:id`

```bash
curl -s -X PATCH http://localhost:3000/users/6650a1b2c3d4e5f6a7b8c9d1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{ "firstName": "Jonathan" }'
```

#### `DELETE /users/:id`

```bash
curl -s -X DELETE http://localhost:3000/users/6650a1b2c3d4e5f6a7b8c9d1 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
# Returns 204 No Content
```

---

### Resources

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/resources` | Yes | Any | List all resources |
| `GET` | `/resources/:id` | Yes | Any | Get resource by ID |
| `POST` | `/resources` | Yes | ORG_ADMIN | Create a resource |
| `PATCH` | `/resources/:id` | Yes | ORG_ADMIN | Update a resource |
| `DELETE` | `/resources/:id` | Yes | ORG_ADMIN | Soft-delete a resource |

#### `POST /resources`

```bash
curl -s -X POST http://localhost:3000/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "name": "Conference Room A",
    "type": "meeting-room",
    "capacity": 8,
    "bufferTime": 10
  }'
```

#### `GET /resources`

```bash
curl -s http://localhost:3000/resources \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### `GET /resources/:id`

```bash
curl -s http://localhost:3000/resources/6650a1b2c3d4e5f6a7b8c9d2 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### `PATCH /resources/:id`

```bash
curl -s -X PATCH http://localhost:3000/resources/6650a1b2c3d4e5f6a7b8c9d2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{ "capacity": 12, "bufferTime": 15 }'
```

#### `DELETE /resources/:id`

```bash
curl -s -X DELETE http://localhost:3000/resources/6650a1b2c3d4e5f6a7b8c9d2 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
# Returns 204 No Content
```

---

### Bookings

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `POST` | `/bookings` | Yes | Any | Create a booking |
| `GET` | `/bookings` | Yes | Any | List bookings (paginated) |
| `GET` | `/bookings/:id` | Yes | Any | Get booking by ID |
| `PATCH` | `/bookings/:id` | Yes | Owner/Admin | Update a booking |
| `DELETE` | `/bookings/:id` | Yes | Owner/Admin | Cancel a booking |

#### `POST /bookings`

```bash
curl -s -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "resourceId": "6650a1b2c3d4e5f6a7b8c9d2",
    "startTime": "2026-06-16T10:00:00-04:00",
    "endTime": "2026-06-16T11:00:00-04:00",
    "title": "Team standup",
    "description": "Daily sync"
  }'
```

#### `GET /bookings`

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page (max 100) |
| `resourceId` | string | — | Filter by resource ID |

```bash
# List all bookings
curl -s "http://localhost:3000/bookings" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Paginated, filtered by resource
curl -s "http://localhost:3000/bookings?page=1&limit=10&resourceId=6650a1b2c3d4e5f6a7b8c9d2" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Response (`200`):**

```json
{
  "data": [ ... ],
  "total": 42,
  "page": 1,
  "limit": 10
}
```

#### `GET /bookings/:id`

```bash
curl -s http://localhost:3000/bookings/6650a1b2c3d4e5f6a7b8c9d3 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### `PATCH /bookings/:id`

Only the booking owner or an `ORG_ADMIN` can update a booking.

```bash
curl -s -X PATCH http://localhost:3000/bookings/6650a1b2c3d4e5f6a7b8c9d3 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{ "title": "Sprint planning", "startTime": "2026-06-16T14:00:00-04:00" }'
```

#### `DELETE /bookings/:id` (Cancel)

Only the booking owner or an `ORG_ADMIN` can cancel a booking. Cancellation is soft — the booking status changes to `CANCELLED`.

```bash
curl -s -X DELETE http://localhost:3000/bookings/6650a1b2c3d4e5f6a7b8c9d3 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

### Availability

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/availability` | Yes | Any | Get available time slots for a resource |

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `resourceId` | string | Yes | MongoDB ObjectId of the resource |
| `startDate` | string | Yes | ISO date to start searching (e.g. `2026-06-16`) |
| `endDate` | string | Yes | ISO date to end searching (e.g. `2026-06-20`) |
| `duration` | number | Yes | Desired slot duration in minutes |

```bash
curl -s "http://localhost:3000/availability?resourceId=6650a1b2c3d4e5f6a7b8c9d2&startDate=2026-06-16&endDate=2026-06-20&duration=60" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Response (`200`):**

```json
{
  "resourceId": "6650a1b2c3d4e5f6a7b8c9d2",
  "duration": 60,
  "count": 4,
  "slots": [
    {
      "startTime": "2026-06-16T09:00:00.000-04:00",
      "endTime": "2026-06-16T10:00:00.000-04:00"
    },
    {
      "startTime": "2026-06-16T10:00:00.000-04:00",
      "endTime": "2026-06-16T11:00:00.000-04:00"
    },
    {
      "startTime": "2026-06-16T11:00:00.000-04:00",
      "endTime": "2026-06-16T12:00:00.000-04:00"
    },
    {
      "startTime": "2026-06-16T14:00:00.000-04:00",
      "endTime": "2026-06-16T15:00:00.000-04:00"
    }
  ]
}
```

---

## Data Models

### Organization

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Unique organization name |
| `timezone` | String | Yes | IANA timezone (e.g. `America/New_York`, `Europe/London`) |
| `workingHours` | Object | Yes | See [Working Hours](#working-hours) below |
| `bookingPolicy` | Object | Yes | See [Booking Policy](#booking-policy) below |
| `isActive` | Boolean | No | Soft-disable flag (default `true`) |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

### User

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `organizationId` | ObjectId | Yes | Parent organization reference |
| `email` | String | Yes | Unique email (lowercased, trimmed) |
| `password` | String | Yes | bcrypt hash (excluded from queries by default) |
| `role` | Enum | Yes | `ORG_ADMIN` or `EMPLOYEE` (default `EMPLOYEE`) |
| `firstName` | String | Yes | |
| `lastName` | String | Yes | |
| `isDeleted` | Boolean | No | Soft-delete flag (default `false`) |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

### Resource

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `organizationId` | ObjectId | Yes | Parent organization reference |
| `name` | String | Yes | Unique within organization |
| `type` | String | Yes | e.g. `meeting-room`, `desk`, `vehicle` |
| `capacity` | Number | Yes | Max occupants (default `1`, min `1`) |
| `bufferTime` | Number | Yes | Minutes of buffer before/after bookings (default `0`) |
| `isDeleted` | Boolean | No | Soft-delete flag (default `false`) |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

### Booking

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `organizationId` | ObjectId | Yes | Parent organization reference |
| `resourceId` | ObjectId | Yes | Booked resource reference |
| `userId` | ObjectId | Yes | User who created the booking |
| `title` | String | Yes | Booking title |
| `description` | String | No | Optional description |
| `startTime` | Date | Yes | UTC start time |
| `endTime` | Date | Yes | UTC end time |
| `bufferStartTime` | Date | Yes | `startTime - effectiveBuffer` |
| `bufferEndTime` | Date | Yes | `endTime + effectiveBuffer` |
| `status` | Enum | Yes | `CONFIRMED` (default) or `CANCELLED` |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

---

## Database Indexes

The following MongoDB indexes are defined for query performance:

### Organization

| Index | Type | Purpose |
|-------|------|---------|
| `{ name: 1 }` | Unique | Enforce unique org names |

### User

| Index | Type | Purpose |
|-------|------|---------|
| `{ organizationId: 1 }` | Standard | Tenant-scoped user queries |
| `{ email: 1 }` | Unique | Enforce unique emails + login lookup |

### Resource

| Index | Type | Purpose |
|-------|------|---------|
| `{ organizationId: 1 }` | Standard | Tenant-scoped resource listing |
| `{ organizationId: 1, name: 1 }` | Unique | Enforce unique resource names within an org |

### Booking

| Index | Type | Purpose |
|-------|------|---------|
| `{ organizationId: 1 }` | Standard | Tenant-scoped booking listing |
| `{ organizationId: 1, resourceId: 1, status: 1, bufferStartTime: 1, bufferEndTime: 1 }` | Compound | Conflict detection queries |
| `{ organizationId: 1, resourceId: 1, startTime: 1, endTime: 1 }` | Compound | Booking range queries |

---

## Configuration Reference

### Working Hours

Defines when the organization is open for bookings.

| Field | Type | Format | Description |
|-------|------|--------|-------------|
| `start` | string | `HH:mm` | Daily opening time (org timezone) |
| `end` | string | `HH:mm` | Daily closing time (org timezone) |
| `daysOfWeek` | number[] | ISO weekdays | Active days (`1`=Mon … `7`=Sun), min 1, no duplicates |

**Example:**

```json
{
  "start": "09:00",
  "end": "17:00",
  "daysOfWeek": [1, 2, 3, 4, 5]
}
```

**Notes:**
- Times are in the organization's timezone, not UTC.
- If `end` ≤ `start` (e.g. overnight shifts), the window wraps past midnight.
- Bookings that fall outside the working hours window are rejected.

### Booking Policy

Controls booking constraints for the organization.

| Field | Type | Description |
|-------|------|-------------|
| `minDuration` | number | Minimum booking length in minutes |
| `maxDuration` | number | Maximum booking length in minutes |
| `bufferTime` | number | Default buffer in minutes before/after each booking (min `0`) |
| `maxAdvanceBooking` | number | How many days ahead a booking can be made |

**Example:**

```json
{
  "minDuration": 15,
  "maxDuration": 480,
  "bufferTime": 10,
  "maxAdvanceBooking": 30
}
```

**Validation rules:**
- `minDuration` must be ≤ `maxDuration`
- `bufferTime` must be ≥ `0`
- `maxAdvanceBooking` must be ≥ `1`

### Effective Buffer Time

When a booking is created or updated, the buffer applied is:

```
effectiveBuffer = max(resource.bufferTime, organization.bookingPolicy.bufferTime)
```

This means a resource-level buffer overrides the org-level buffer if it's larger.


| Status | Error Class | When |
|--------|------------|------|
| 400 | `ValidationError` | Invalid input (Zod or Mongoose validation failure) |
| 401 | `AuthenticationError` | Missing, malformed, or expired JWT token |
| 403 | `AuthorizationError` | Authenticated but insufficient role permissions |
| 404 | `NotFoundError` | Resource, user, organization, or booking not found |
| 409 | `ConflictError` | Duplicate email, unique constraint violation |
| 409 | `BookingConflictError` | Booking overlaps with an existing booking (includes `conflictingBookingId` and `conflictingWindow` in details) |
| 500 | Internal server error | Unexpected failures |

**Production behavior:** When `NODE_ENV=production`, internal error messages and stack traces are suppressed. The response returns a generic `"Internal server error"` message for 500-level errors.




## Deployment
optional 

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Environment Checklist

Before deploying, ensure:

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` points to a production MongoDB instance
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are strong, unique, and randomly generated
- [ ] `JWT_ACCESS_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN` are set to appropriate values
- [ ] MongoDB connection has proper authentication and network access configured
- [ ] Port is correctly configured for your hosting environment




## License

Habibur Rhaman
