import { z } from 'zod';
import { UserRole } from '../types';

export const createUserSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  role: z.nativeEnum(UserRole).default(UserRole.EMPLOYEE),
});

export const updateUserSchema = z
  .object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1).trim(),
    lastName: z.string().min(1).trim(),
    role: z.nativeEnum(UserRole),
  })
  .partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
