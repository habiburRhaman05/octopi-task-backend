import { z } from 'zod';
import { objectIdSchema, paginationSchema } from './common';

const isoDateTimeSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid ISO datetime' });

export const createBookingSchema = z.object({
  resourceId: objectIdSchema,
  startTime: isoDateTimeSchema,
  endTime: isoDateTimeSchema,
  title: z.string().min(1).trim(),
  description: z.string().trim().optional(),
});

export const updateBookingSchema = z
  .object({
    startTime: isoDateTimeSchema,
    endTime: isoDateTimeSchema,
    title: z.string().min(1).trim(),
    description: z.string().trim(),
  })
  .partial();

export const listBookingsQuerySchema = paginationSchema.extend({
  resourceId: objectIdSchema.optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
