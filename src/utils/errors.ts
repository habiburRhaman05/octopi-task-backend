export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', details?: unknown) {
    super(message, 401, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', details?: unknown) {
    super(message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict detected', details?: unknown) {
    super(message, 409, details);
  }
}
