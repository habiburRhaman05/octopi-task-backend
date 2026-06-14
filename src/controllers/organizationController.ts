import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../services/OrganizationService';
import { ensureTenant } from '../middleware/auth';
import { UpdateOrganizationInput } from '../validation/organization';

export async function getOrganization(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId } = ensureTenant(req);
    const org = await OrganizationService.getById(organizationId);
    res.status(200).json(org);
  } catch (err) {
    next(err);
  }
}

export async function updateOrganization(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId } = ensureTenant(req);
    const org = await OrganizationService.update(
      organizationId,
      req.body as UpdateOrganizationInput
    );
    res.status(200).json(org);
  } catch (err) {
    next(err);
  }
}
