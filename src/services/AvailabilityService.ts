import { Types } from 'mongoose';
import { DateTime, Interval } from 'luxon';
import { Booking, Resource, Organization } from '../models';
import type { OrganizationDocument } from '../models';
import { BookingStatus } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';
import { toOrgIsoString } from '../utils/timezone';
import { env } from '../config/env';

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}

export interface AvailabilityQuery {
  resourceId: string;
  startDate: string;
  endDate: string;
  duration: number;
}

interface OccupiedInterval {
  start: Date;
  end: Date;
}

export class AvailabilityService {
  static async getAvailableSlots(
    organizationId: string,
    query: AvailabilityQuery
  ): Promise<AvailabilitySlot[]> {
    const org = await this.loadOrganization(organizationId);
    const resource = await this.loadResource(organizationId, query.resourceId);

    const { minDuration, maxDuration, maxAdvanceBooking } = org.bookingPolicy;
    if (query.duration < minDuration || query.duration > maxDuration) {
      throw new ValidationError(
        `duration must be between ${minDuration} and ${maxDuration} minutes`
      );
    }

    const rangeStartLocal = DateTime.fromISO(query.startDate, { zone: org.timezone })
      .startOf('day');
    const rangeEndLocal = DateTime.fromISO(query.endDate, { zone: org.timezone })
      .startOf('day');

    if (!rangeStartLocal.isValid || !rangeEndLocal.isValid) {
      throw new ValidationError('Invalid startDate or endDate');
    }
    if (rangeEndLocal < rangeStartLocal) {
      throw new ValidationError('endDate must be on or after startDate');
    }

    const maxAdvanceLocal = DateTime.now()
      .setZone(org.timezone)
      .plus({ days: maxAdvanceBooking })
      .endOf('day');

    const granularity = env.SLOT_GRANULARITY_MINUTES;
    const effectiveBuffer = Math.max(resource.bufferTime, org.bookingPolicy.bufferTime);
    const now = DateTime.now().setZone(org.timezone);

    const rangeStartUtc = rangeStartLocal.toUTC().toJSDate();
    const rangeEndUtc = rangeEndLocal.endOf('day').plus({ days: 1 }).toUTC().toJSDate();
    const occupied = await this.loadOccupiedIntervals(
      organizationId,
      query.resourceId,
      rangeStartUtc,
      rangeEndUtc
    );

    const slots: AvailabilitySlot[] = [];

    for (
      let day = rangeStartLocal;
      day <= rangeEndLocal;
      day = day.plus({ days: 1 })
    ) {
      if (day > maxAdvanceLocal) {
        break;
      }

      const window = this.getWorkingWindow(org, day);
      if (!window) {
        continue;
      }

      this.collectSlotsForWindow(
        window,
        query.duration,
        granularity,
        effectiveBuffer,
        occupied,
        now,
        org.timezone,
        slots
      );
    }

    return slots;
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
    console.log("bu",resourceId);
    
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

  private static async loadOccupiedIntervals(
    organizationId: string,
    resourceId: string,
    rangeStart: Date,
    rangeEnd: Date
  ): Promise<OccupiedInterval[]> {
    const bookings = await Booking.find({
      organizationId: new Types.ObjectId(organizationId),
      resourceId: new Types.ObjectId(resourceId),
      status: BookingStatus.CONFIRMED,
      bufferStartTime: { $lt: rangeEnd },
      bufferEndTime: { $gt: rangeStart },
    })
      .select('bufferStartTime bufferEndTime')
      .sort({ bufferStartTime: 1 })
      .lean();

    return bookings.map((b) => ({
      start: b.bufferStartTime,
      end: b.bufferEndTime,
    }));
  }

  private static getWorkingWindow(
    org: OrganizationDocument,
    localDay: DateTime
  ): Interval | null {
    const weekday = localDay.weekday;
    if (!org.workingHours.daysOfWeek.includes(weekday as never)) {
      return null;
    }

    const [startHour, startMinute] = org.workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = org.workingHours.end.split(':').map(Number);

    const start = localDay.set({
      hour: startHour,
      minute: startMinute,
      second: 0,
      millisecond: 0,
    });
    let end = localDay.set({
      hour: endHour,
      minute: endMinute,
      second: 0,
      millisecond: 0,
    });
    if (end <= start) {
      end = end.plus({ days: 1 });
    }

    return Interval.fromDateTimes(start.toUTC(), end.toUTC());
  }

  private static collectSlotsForWindow(
    window: Interval,
    duration: number,
    granularity: number,
    buffer: number,
    occupied: OccupiedInterval[],
    now: DateTime,
    timezone: string,
    out: AvailabilitySlot[]
  ): void {
    const windowStart = window.start;
    const windowEnd = window.end;
    if (!windowStart || !windowEnd) {
      return;
    }

    let cursor = windowStart;
    while (cursor.plus({ minutes: duration }) <= windowEnd) {
      const slotStart = cursor;
      const slotEnd = cursor.plus({ minutes: duration });
// console.log(slotEnd-slotStart);

      if (slotStart > now) {
        const candStart = slotStart.minus({ minutes: buffer }).toJSDate();
        const candEnd = slotEnd.plus({ minutes: buffer }).toJSDate();

        if (!this.collidesWithOccupied(candStart, candEnd, occupied)) {
          out.push({
            startTime: toOrgIsoString(slotStart.toUTC().toJSDate(), timezone),
            endTime: toOrgIsoString(slotEnd.toUTC().toJSDate(), timezone),
          });
        }
      }

      cursor = cursor.plus({ minutes: granularity });
    }
  }

  private static collidesWithOccupied(
    candStart: Date,
    candEnd: Date,
    occupied: OccupiedInterval[]
  ): boolean {
    for (const interval of occupied) {
      if (candStart < interval.end && candEnd > interval.start) {
        return true;
      }
    }
    return false;
  }
}
