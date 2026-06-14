import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole, TenantContext } from '../types';
import { AuthenticationError } from '../utils/errors';

const SALT_ROUNDS = 12;

export interface TokenPayload {
  userId: string;
  organizationId: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateTokens(context: TenantContext): TokenPair {
    const base = {
      userId: context.userId,
      organizationId: context.organizationId,
      role: context.role,
    };

    const accessToken = jwt.sign(
      { ...base, type: 'access' } satisfies TokenPayload,
      env.JWT_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as SignOptions
    );

    const refreshToken = jwt.sign(
      { ...base, type: 'refresh' } satisfies TokenPayload,
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as SignOptions
    );

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): TokenPayload {
    return this.verify(token, env.JWT_SECRET, 'access');
  }

  static verifyRefreshToken(token: string): TokenPayload {
    return this.verify(token, env.JWT_REFRESH_SECRET, 'refresh');
  }

  private static verify(
    token: string,
    secret: string,
    expectedType: TokenPayload['type']
  ): TokenPayload {
    try {
      const decoded = jwt.verify(token, secret) as TokenPayload;
      if (decoded.type !== expectedType) {
        throw new AuthenticationError(`Invalid token type (expected ${expectedType})`);
      }
      return decoded;
    } catch (err) {
      if (err instanceof AuthenticationError) {
        throw err;
      }
      throw new AuthenticationError('Invalid or expired token');
    }
  }
}
