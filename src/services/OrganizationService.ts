import { Organization, OrganizationDocument } from '../models';
import { NotFoundError } from '../utils/errors';
import { UpdateOrganizationInput } from '../validation/organization';

export class OrganizationService {
  static async getById(organizationId: string): Promise<OrganizationDocument> {
    const org = await Organization.findById(organizationId);
    if (!org || !org.isActive) {
      throw new NotFoundError('Organisation not found');
    }
    return org;
  }

  static async update(
    organizationId: string,
    input: UpdateOrganizationInput
  ): Promise<OrganizationDocument> {
    const org = await Organization.findById(organizationId);
    console.log("org",org);
    
    if (!org || !org.isActive) {
      throw new NotFoundError('Organisation not found');
    }

    Object.assign(org, input);
    await org.save();
    console.log("saved");
    
    return org;
  }
}
