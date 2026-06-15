import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/BookingService';
import { ensureTenant } from '../middleware/auth';
import { getParam } from '../utils/http';
import { UserRole } from '../types';
import { AuthorizationError } from '../utils/errors';
import {
  CreateBookingInput,
  UpdateBookingInput,
  ListBookingsQuery,
} from '../validation/booking';

export async function createBooking(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId, userId } = ensureTenant(req);
    const booking = await BookingService.create(
      organizationId,
      userId,
      req.body as CreateBookingInput
    );
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

export async function listBookings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId } = ensureTenant(req);
    const query = (req.validatedQuery ?? {}) as ListBookingsQuery;
    const result = await BookingService.list(organizationId, {
      page: query.page,
      limit: query.limit,
      resourceId: query.resourceId,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId } = ensureTenant(req);
    console.log(organizationId);
    
    const booking = await BookingService.getById(organizationId, getParam(req, 'id'));
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

export async function updateBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenant = ensureTenant(req);
    const id = getParam(req, 'id');
    await assertOwnerOrAdmin(tenant.organizationId, tenant.userId, tenant.role, id);
    const booking = await BookingService.update(
      tenant.organizationId,
      id,
      req.body as UpdateBookingInput
    );
    res.status(200).json(booking);
  } catch (err) {
    // console.log("errir on updateing bookin");
    
    next(err);
  }
}

export async function cancelBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenant = ensureTenant(req);
    const id = getParam(req, 'id');
    await assertOwnerOrAdmin(tenant.organizationId, tenant.userId, tenant.role, id);
    const booking = await BookingService.cancel(tenant.organizationId, id);
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

async function assertOwnerOrAdmin(
  organizationId: string,
  userId: string,
  role: UserRole,
  bookingId: string
): Promise<void> {
  if (role === UserRole.ORG_ADMIN) {
    return;
  }
  const booking = await BookingService.getById(organizationId, bookingId);
  if (booking.userId.toString() !== userId) {
    throw new AuthorizationError('You may only modify your own bookings');
  }
}
