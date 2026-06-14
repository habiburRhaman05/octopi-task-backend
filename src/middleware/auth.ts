import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRole, TenantContext } from '../types';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(new AuthenticationError('Missing or malformed Authorization header'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    next(new AuthenticationError('Missing bearer token'));
    return;
  }

  try {
    const payload = AuthService.verifyAccessToken(token);
    req.tenant = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      next(new AuthenticationError('Authentication required'));
      return;
    }
    if (!allowedRoles.includes(req.tenant.role)) {
      next(new AuthorizationError('Insufficient permissions for this action'));
      return;
    }
    next();
  };
}

export function ensureTenant(req: Request): TenantContext {
  if (!req.tenant) {
    throw new AuthenticationError('Authentication required');
  }
  return req.tenant;
}
