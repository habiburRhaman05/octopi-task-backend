import { Request } from 'express';

export function getParam(req: Request, name: string): string {
  const value = (req.params as Record<string, string | string[] | undefined>)[name];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}
