import { Schema, model, Document, Types } from 'mongoose';
import { WorkingHours, BookingPolicy, IsoWeekday } from '../types';
import { isValidTimezone } from '../utils/timezone';

export interface OrganizationDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  timezone: string;
  workingHours: WorkingHours;
  bookingPolicy: BookingPolicy;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const workingHoursSchema = new Schema<WorkingHours>(
  {
    start: {
      type: String,
      required: true,
      match: [/^([01]?\d|2[0-3]):([0-5]\d)$/, 'workingHours.start must be HH:mm'],
    },
    end: {
      type: String,
      required: true,
      match: [/^([01]?\d|2[0-3]):([0-5]\d)$/, 'workingHours.end must be HH:mm'],
    },
    daysOfWeek: {
      type: [Number],
      required: true,
      validate: {
        validator: (days: number[]): boolean =>
          days.length > 0 &&
          days.every((d) => Number.isInteger(d) && d >= 1 && d <= 7),
        message: 'daysOfWeek must be ISO weekday numbers between 1 and 7',
      },
    },
  },
  { _id: false }
);

const bookingPolicySchema = new Schema<BookingPolicy>(
  {
    minDuration: { type: Number, required: true, min: 1 },
    maxDuration: { type: Number, required: true, min: 1 },
    bufferTime: { type: Number, required: true, min: 0, default: 0 },
    maxAdvanceBooking: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const organizationSchema = new Schema<OrganizationDocument>(
  {
    name: { type: String, required: true, trim: true },
    timezone: {
      type: String,
      required: true,
      validate: {
        validator: (tz: string): boolean => isValidTimezone(tz),
        message: (props): string => `\"${props.value}\" is not a valid IANA timezone`,
      },
    },
    workingHours: { type: workingHoursSchema, required: true },
    bookingPolicy: { type: bookingPolicySchema, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

organizationSchema.index({ name: 1 }, { unique: true });

export const Organization = model<OrganizationDocument>(
  'Organization',
  organizationSchema
);

export type { WorkingHours, BookingPolicy, IsoWeekday };
