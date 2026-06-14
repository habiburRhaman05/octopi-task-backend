import { Request, Response, NextFunction } from 'express';
import { ResourceService } from '../services/ResourceService';
import { ensureTenant } from '../middleware/auth';
import { getParam } from '../utils/http';
import { CreateResourceInput, UpdateResourceInput } from '../validation/resource';

export async function createResource(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId } = ensureTenant(req);
    const resource = await ResourceService.create(
      organizationId,
      req.body as CreateResourceInput
    );
    res.status(201).json(resource);
  } catch (err) {
    next(err);
  }
}

export async function listResources(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId } = ensureTenant(req);
    const resources = await ResourceService.list(organizationId);
    res.status(200).json(resources);
  } catch (err) {
    next(err);
  }
}

export async function getResource(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId } = ensureTenant(req);
    const resource = await ResourceService.getById(organizationId, getParam(req, 'id'));
    res.status(200).json(resource);
  } catch (err) {
    next(err);
  }
}

export async function updateResource(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId } = ensureTenant(req);
    const resource = await ResourceService.update(
      organizationId,
      getParam(req, 'id'),
      req.body as UpdateResourceInput
    );
    res.status(200).json(resource);
  } catch (err) {
    next(err);
  }
}

export async function deleteResource(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId } = ensureTenant(req);
    await ResourceService.remove(organizationId, getParam(req, 'id'));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
