import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { ensureTenant } from '../middleware/auth';
import { getParam } from '../utils/http';
import { CreateUserInput, UpdateUserInput } from '../validation/user';

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId } = ensureTenant(req);
    const user = await UserService.create(
      organizationId,
      req.body as CreateUserInput
    );
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId } = ensureTenant(req);
    const users = await UserService.list(organizationId);
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

export async function getUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId } = ensureTenant(req);
    const user = await UserService.getById(organizationId, getParam(req, 'id'));
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId } = ensureTenant(req);
    const user = await UserService.update(
      organizationId,
      getParam(req, 'id'),
      req.body as UpdateUserInput
    );
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId } = ensureTenant(req);
    await UserService.remove(organizationId, getParam(req, 'id'));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
