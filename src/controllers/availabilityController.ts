import { Request, Response, NextFunction } from 'express';
import { AvailabilityService } from '../services/AvailabilityService';
import { ensureTenant } from '../middleware/auth';
import { AvailabilityQueryInput } from '../validation/availability';

export async function getAvailability(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { organizationId } = ensureTenant(req);
    const query = req.validatedQuery as AvailabilityQueryInput;

    const slots = await AvailabilityService.getAvailableSlots(organizationId, {
      resourceId: query.resourceId,
      startDate: query.startDate,
      endDate: query.endDate,
      duration: query.duration,
    });

    res.status(200).json({
      resourceId: query.resourceId,
      duration: query.duration,
      count: slots.length,
      slots,
    });
  } catch (err) {
    next(err);
  }
}
