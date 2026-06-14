import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodType } from 'zod';
import { ValidationError } from '../utils/errors';

type ObjectSchema = ZodType<Record<string, unknown>>;

export interface RequestSchemas {
  body?: ObjectSchema;
  query?: ObjectSchema;
  params?: ObjectSchema;
}

export function validate(schemas: RequestSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.validatedQuery = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params);
        for (const [key, value] of Object.entries(parsedParams)) {
          (req.params as Record<string, unknown>)[key] = value;
        }
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ValidationError('Validation failed', err.flatten()));
        return;
      }
      next(err);
    }
  };
}
