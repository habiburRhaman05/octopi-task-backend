import { z } from 'zod';
import { Types } from 'mongoose';
import { isValidTimezone } from '../utils/timezone';

export const objectIdSchema = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid id',
  });

export const timezoneSchema = z
  .string()
  .refine((tz) => isValidTimezone(tz), {
    message: 'Invalid IANA timezone',
  });

export const timeOfDaySchema = z
  .string()
  .regex(/^([01]?\d|2[0-3]):([0-5]\d)$/, 'Must be a valid HH:mm time');

export const isoWeekdaySchema = z.number().int().min(1).max(7);

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: objectIdSchema,
});
