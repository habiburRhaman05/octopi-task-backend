import { z } from 'zod';

export const createResourceSchema = z.object({
  name: z.string().min(1).trim(),
  type: z.string().min(1).trim(),
  capacity: z.number().int().positive().default(1),
  bufferTime: z.number().int().min(0).default(0),
});

export const updateResourceSchema = createResourceSchema.partial();

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
