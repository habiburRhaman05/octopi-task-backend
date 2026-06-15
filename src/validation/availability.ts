import { z } from 'zod';
import { objectIdSchema } from './common';

const dateInputSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });

export const availabilityQuerySchema = z.object({
  resourceId: objectIdSchema,
  startDate: dateInputSchema,
  endDate: dateInputSchema,
  duration: z.coerce.number().int().positive(),
});

export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
