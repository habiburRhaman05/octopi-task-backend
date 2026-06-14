import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

interface ErrorResponseBody {
  error: string;
  details?: unknown;
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  const body: ErrorResponseBody = { error: 'Internal server error' };

  if (err instanceof ZodError) {
    statusCode = 400;
    body.error = 'Validation failed';
    body.details = err.flatten();
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    body.error = err.message;
    if (err.details !== undefined) {
      body.details = err.details;
    }
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    body.error = 'Validation failed';
    body.details = Object.values(err.errors).map((e) => e.message);
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    body.error = `Invalid value for field \"${err.path}\"`;
  } else if (isDuplicateKeyError(err)) {
    statusCode = 409;
    body.error = 'Duplicate value violates a uniqueness constraint';
    body.details = err.keyValue;
  } else if (err instanceof Error) {
    body.error =
      env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  }

  if (env.NODE_ENV !== 'production' && err instanceof Error && statusCode >= 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json(body);
}

interface MongoDuplicateKeyError extends Error {
  code: number;
  keyValue?: Record<string, unknown>;
}

function isDuplicateKeyError(err: unknown): err is MongoDuplicateKeyError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 11000
  );
}
