import { Request } from 'express';

export enum UserRole {
  ORG_ADMIN = 'ORG_ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface TenantContext {
  userId: string;
  organizationId: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  tenant?: TenantContext;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      validatedQuery?: Record<string, unknown>;
    }
  }
}

export interface WorkingHours {
  start: string;
  end: string;
  daysOfWeek: IsoWeekday[];
}

export interface BookingPolicy {
  minDuration: number;
  maxDuration: number;
  bufferTime: number;
  maxAdvanceBooking: number;
}
