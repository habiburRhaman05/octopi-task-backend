import { Types } from 'mongoose';
import { User, UserDocument } from '../models';
import { NotFoundError } from '../utils/errors';
import { AuthService } from './AuthService';
import { CreateUserInput, UpdateUserInput } from '../validation/user';

export class UserService {
  static async create(
    organizationId: string,
    input: CreateUserInput
  ): Promise<UserDocument> {
    const password = await AuthService.hashPassword(input.password);
    const user = await User.create({
      ...input,
      password,
      organizationId: new Types.ObjectId(organizationId),
    });
    user.set('password', undefined);
    return user;
  }

  static async list(organizationId: string): Promise<UserDocument[]> {
    return User.find({ organizationId, isDeleted: false }).sort({ createdAt: -1 });
  }

  static async getById(
    organizationId: string,
    userId: string
  ): Promise<UserDocument> {
    const user = await User.findOne({
      _id: userId,
      organizationId,
      isDeleted: false,
    });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  static async update(
    organizationId: string,
    userId: string,
    input: UpdateUserInput
  ): Promise<UserDocument> {
    const user = await this.getById(organizationId, userId);

    const { password, ...rest } = input;
    Object.assign(user, rest);
    if (password) {
      user.password = await AuthService.hashPassword(password);
    }
    await user.save();
    user.set('password', undefined);
    return user;
  }

  static async remove(organizationId: string, userId: string): Promise<void> {
    const user = await this.getById(organizationId, userId);
    user.isDeleted = true;
    await user.save();
  }
}
