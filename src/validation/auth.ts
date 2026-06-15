import { z } from 'zod';
import { workingHoursSchema, bookingPolicySchema } from './organization';
import { timezoneSchema } from './common';

export const registerSchema = z.object({
  organization: z.object({
    name: z.string().min(1).trim(),
    timezone: timezoneSchema,
    workingHours: workingHoursSchema,
    bookingPolicy: bookingPolicySchema,
  }),
  admin: z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1).trim(),
    lastName: z.string().min(1).trim(),
  }),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
