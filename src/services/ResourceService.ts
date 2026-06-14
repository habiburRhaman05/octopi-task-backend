import { Types } from 'mongoose';
import { Resource, ResourceDocument } from '../models';
import { NotFoundError } from '../utils/errors';
import { CreateResourceInput, UpdateResourceInput } from '../validation/resource';

export class ResourceService {
  static async create(
    organizationId: string,
    input: CreateResourceInput
  ): Promise<ResourceDocument> {
    return Resource.create({
      ...input,
      organizationId: new Types.ObjectId(organizationId),
    });
  }

  static async list(organizationId: string): Promise<ResourceDocument[]> {
    return Resource.find({ organizationId, isDeleted: false }).sort({
      createdAt: -1,
    });
  }

  static async getById(
    organizationId: string,
    resourceId: string
  ): Promise<ResourceDocument> {
    const resource = await Resource.findOne({
      _id: resourceId,
      organizationId,
      isDeleted: false,
    });
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }
    return resource;
  }

  static async update(
    organizationId: string,
    resourceId: string,
    input: UpdateResourceInput
  ): Promise<ResourceDocument> {
    const resource = await this.getById(organizationId, resourceId);
    Object.assign(resource, input);
    await resource.save();
    return resource;
  }

  static async remove(organizationId: string, resourceId: string): Promise<void> {
    const resource = await this.getById(organizationId, resourceId);
    resource.isDeleted = true;
    await resource.save();
  }
}
