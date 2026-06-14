import { Types } from 'mongoose';
import { DateTime } from 'luxon';
import { Booking, BookingDocument, Resource, Organization } from '../models';
import type { OrganizationDocument } from '../models';
import { BookingStatus } from '../types';
import {
  NotFoundError,
  ValidationError,
  BookingConflictError,
} from '../utils/errors';
import { convertToUTC, getWorkingHoursWindow } from '../utils/timezone';
import { CreateBookingInput, UpdateBookingInput } from '../validation/booking';

interface ResolvedTimes {
  startTime: Date;
  endTime: Date;
  bufferStartTime: Date;
  bufferEndTime: Date;
}

export class BookingService {
  static async create(
    organizationId: string,
    userId: string,
    input: CreateBookingInput
  ): Promise<BookingDocument> {
    const org = await this.loadOrganization(organizationId);
    const resource = await this.loadResource(organizationId, input.resourceId);

    const times = this.resolveAndValidateTimes(
      org,
      resource.bufferTime,
      input.startTime,
      input.endTime
    );

    await this.assertNoConflict(
      organizationId,
      input.resourceId,
      times.bufferStartTime,
      times.bufferEndTime
    );

    return Booking.create({
      organizationId: new Types.ObjectId(organizationId),
      resourceId: new Types.ObjectId(input.resourceId),
      userId: new Types.ObjectId(userId),
      title: input.title,
      description: input.description,
      ...times,
      status: BookingStatus.CONFIRMED,
    });
  }

  static async list(
    organizationId: string,
    options: { page: number; limit: number; resourceId?: string }
  ): Promise<{ data: BookingDocument[]; total: number; page: number; limit: number }> {
    const filter: Record<string, unknown> = { organizationId };
    if (options.resourceId) {
      filter.resourceId = new Types.ObjectId(options.resourceId);
    }

    const [data, total] = await Promise.all([
      Booking.find(filter)
        .sort({ startTime: -1 })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit),
      Booking.countDocuments(filter),
    ]);

    return { data, total, page: options.page, limit: options.limit };
  }

  static async getById(
    organizationId: string,
    bookingId: string
  ): Promise<BookingDocument> {
    const booking = await Booking.findOne({ _id: bookingId, organizationId });
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    return booking;
  }

  static async update(
    organizationId: string,
    bookingId: string,
    input: UpdateBookingInput
  ): Promise<BookingDocument> {
    const booking = await this.getById(organizationId, bookingId);
    if (booking.status === BookingStatus.CANCELLED) {
      throw new ValidationError('Cannot update a cancelled booking');
    }

    const timesChanged =
      input.startTime !== undefined || input.endTime !== undefined;

    if (timesChanged) {
      const org = await this.loadOrganization(organizationId);
      const resource = await this.loadResource(
        organizationId,
        booking.resourceId.toString()
      );

      const startIso = input.startTime ?? booking.startTime.toISOString();
      const endIso = input.endTime ?? booking.endTime.toISOString();

      const times = this.resolveAndValidateTimes(
        org,
        resource.bufferTime,
        startIso,
        endIso
      );

      await this.assertNoConflict(
        organizationId,
        booking.resourceId.toString(),
        times.bufferStartTime,
        times.bufferEndTime,
        booking._id
      );

      booking.startTime = times.startTime;
      booking.endTime = times.endTime;
      booking.bufferStartTime = times.bufferStartTime;
      booking.bufferEndTime = times.bufferEndTime;
    }

    if (input.title !== undefined) booking.title = input.title;
    if (input.description !== undefined) booking.description = input.description;

    await booking.save();
    return booking;
  }

  static async cancel(
    organizationId: string,
    bookingId: string
  ): Promise<BookingDocument> {
    const booking = await this.getById(organizationId, bookingId);
    booking.status = BookingStatus.CANCELLED;
    await booking.save();
    return booking;
  }

  private static async loadOrganization(
    organizationId: string
  ): Promise<OrganizationDocument> {
    const org = await Organization.findById(organizationId);
    if (!org || !org.isActive) {
      throw new NotFoundError('Organisation not found');
    }
    return org;
  }

  private static async loadResource(
    organizationId: string,
    resourceId: string
  ): Promise<{ bufferTime: number }> {
    const resource = await Resource.findOne({
      _id: resourceId,
      organizationId,
      isDeleted: false,
    });
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }
    return resource;
  }

  private static resolveAndValidateTimes(
    org: OrganizationDocument,
    resourceBuffer: number,
    startInput: string,
    endInput: string
  ): ResolvedTimes {
    const startTime = convertToUTC(startInput, org.timezone);
    const endTime = convertToUTC(endInput, org.timezone);

    if (endTime <= startTime) {
      throw new ValidationError('endTime must be after startTime');
    }

    const now = new Date();
    if (startTime < now) {
      throw new ValidationError('Cannot create a booking in the past');
    }

    const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
    const { minDuration, maxDuration, maxAdvanceBooking } = org.bookingPolicy;

    if (durationMinutes < minDuration) {
      throw new ValidationError(
        `Booking duration ${durationMinutes}m is below the minimum of ${minDuration}m`
      );
    }
    if (durationMinutes > maxDuration) {
      throw new ValidationError(
        `Booking duration ${durationMinutes}m exceeds the maximum of ${maxDuration}m`
      );
    }

    const maxAdvanceDate = DateTime.now()
      .setZone(org.timezone)
      .plus({ days: maxAdvanceBooking })
      .toUTC()
      .toJSDate();
    if (startTime > maxAdvanceDate) {
      throw new ValidationError(
        `Booking start exceeds the maximum advance window of ${maxAdvanceBooking} days`
      );
    }

    this.assertWithinWorkingHours(org, startTime, endTime);

    const effectiveBuffer = Math.max(resourceBuffer, org.bookingPolicy.bufferTime);
    const bufferStartTime = new Date(startTime.getTime() - effectiveBuffer * 60000);
    const bufferEndTime = new Date(endTime.getTime() + effectiveBuffer * 60000);

    return { startTime, endTime, bufferStartTime, bufferEndTime };
  }

  private static assertWithinWorkingHours(
    org: OrganizationDocument,
    startTime: Date,
    endTime: Date
  ): void {
    const window = getWorkingHoursWindow(startTime, org.workingHours, org.timezone);
    if (!window) {
      throw new ValidationError(
        'Booking falls on a non-working day for this organisation'
      );
    }

    const windowStart = window.start!.toJSDate();
    const windowEnd = window.end!.toJSDate();

    if (startTime < windowStart || endTime > windowEnd) {
      throw new ValidationError(
        'Booking must fall within the organisation working hours'
      );
    }
  }

  private static async assertNoConflict(
    organizationId: string,
    resourceId: string,
    bufStart: Date,
    bufEnd: Date,
    excludeBookingId?: Types.ObjectId
  ): Promise<void> {
    const filter: Record<string, unknown> = {
      organizationId: new Types.ObjectId(organizationId),
      resourceId: new Types.ObjectId(resourceId),
      status: BookingStatus.CONFIRMED,
      $or: [
        { bufferStartTime: { $lte: bufStart }, bufferEndTime: { $gte: bufEnd } },
        { bufferStartTime: { $gte: bufStart, $lt: bufEnd } },
        { bufferEndTime: { $gt: bufStart, $lte: bufEnd } },
      ],
    };

    if (excludeBookingId) {
      filter._id = { $ne: excludeBookingId };
    }

    const conflict = await Booking.findOne(filter).lean();
    if (conflict) {
      throw new BookingConflictError(
        'Booking conflicts with an existing booking (including buffer time)',
        {
          conflictingBookingId: conflict._id,
          conflictingWindow: {
            start: conflict.startTime,
            end: conflict.endTime,
          },
        }
      );
    }
  }
}
