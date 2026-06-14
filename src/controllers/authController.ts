import { Request, Response, NextFunction } from 'express';
import { Organization, User } from '../models';
import { AuthService } from '../services/AuthService';
import { UserRole, IsoWeekday } from '../types';
import { ensureTenant } from '../middleware/auth';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';
import { RegisterInput, LoginInput, RefreshInput } from '../validation/auth';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as RegisterInput;

    const existing = await User.findOne({ email: body.admin.email }).lean();
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const organization = await Organization.create({
      name: body.organization.name,
      timezone: body.organization.timezone,
      workingHours: {
        start: body.organization.workingHours.start,
        end: body.organization.workingHours.end,
        daysOfWeek: body.organization.workingHours.daysOfWeek as IsoWeekday[],
      },
      bookingPolicy: body.organization.bookingPolicy,
    });

    try {
      const password = await AuthService.hashPassword(body.admin.password);
      const admin = await User.create({
        organizationId: organization._id,
        email: body.admin.email,
        password,
        role: UserRole.ORG_ADMIN,
        firstName: body.admin.firstName,
        lastName: body.admin.lastName,
      });

      const tokens = AuthService.generateTokens({
        userId: admin._id.toString(),
        organizationId: organization._id.toString(),
        role: UserRole.ORG_ADMIN,
      });

      res.status(201).json({
        organization: { id: organization._id, name: organization.name },
        user: {
          id: admin._id,
          email: admin.email,
          role: admin.role,
          firstName: admin.firstName,
          lastName: admin.lastName,
        },
        ...tokens,
      });
    } catch (err) {
      await Organization.deleteOne({ _id: organization._id });
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as LoginInput;

    const user = await User.findOne({ email, isDeleted: false }).select('+password');
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const valid = await AuthService.verifyPassword(password, user.password);
    if (!valid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const tokens = AuthService.generateTokens({
      userId: user._id.toString(),
      organizationId: user.organizationId.toString(),
      role: user.role,
    });

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
}

export async function profile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenant = ensureTenant(req);
    const user = await User.findOne({
      _id: tenant.userId,
      organizationId: tenant.organizationId,
      isDeleted: false,
    });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId,
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body as RefreshInput;
    const payload = AuthService.verifyRefreshToken(refreshToken);

    const user = await User.findOne({
      _id: payload.userId,
      organizationId: payload.organizationId,
      isDeleted: false,
    });
    if (!user) {
      throw new AuthenticationError('User no longer exists');
    }

    const tokens = AuthService.generateTokens({
      userId: user._id.toString(),
      organizationId: user.organizationId.toString(),
      role: user.role,
    });

    res.status(200).json(tokens);
  } catch (err) {
    next(err);
  }
}
