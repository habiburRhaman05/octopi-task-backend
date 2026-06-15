import { z } from 'zod';
import { timezoneSchema, timeOfDaySchema, isoWeekdaySchema } from './common';

export const workingHoursSchema = z.object({
  start: timeOfDaySchema,
  end: timeOfDaySchema,
  daysOfWeek: z
    .array(isoWeekdaySchema)
    .min(1, 'At least one working day is required')
    .refine((days) => new Set(days).size === days.length, {
      message: 'daysOfWeek must not contain duplicates',
    }),
});

export const bookingPolicySchema = z
  .object({
    minDuration: z.number().int().positive(),
    maxDuration: z.number().int().positive(),
    bufferTime: z.number().int().min(0).default(0),
    maxAdvanceBooking: z.number().int().positive(),
  })
  .refine((p) => p.minDuration <= p.maxDuration, {
    message: 'minDuration must be less than or equal to maxDuration',
    path: ['minDuration'],
  });

export const createOrganizationSchema = z.object({
  name: z.string().min(1).trim(),
  timezone: timezoneSchema,
  workingHours: workingHoursSchema,
  bookingPolicy: bookingPolicySchema,
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
