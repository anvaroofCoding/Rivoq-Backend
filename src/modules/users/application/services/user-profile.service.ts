import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  UserProfile,
  UserProfileDocument,
} from '../../infrastructure/persistence/user-profile.schema.js';

import { CompleteProfileDto } from '../../../auth/application/dto/complete-profile.dto.js';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectModel(UserProfile.name)
    private readonly userProfileModel: Model<UserProfileDocument>,
  ) {}

  async createProfile(
    userId: string | Types.ObjectId,
    completeProfileDto: CompleteProfileDto,
  ): Promise<UserProfile> {
    try {
      const existingProfile = await this.userProfileModel.findOne({ userId });
      if (existingProfile) {
        throw new BadRequestException('Profile already exists for this user');
      }

      const userProfile = await this.userProfileModel.create({
        userId: new Types.ObjectId(userId),
        ...completeProfileDto,
        status: 'active',
      });

      return userProfile;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`${error}`);
    }
  }

  async getProfileByUserId(
    userId: string | Types.ObjectId,
  ): Promise<UserProfile | null> {
    return this.userProfileModel.findOne({ userId }).exec();
  }

  async updateProfile(
    userId: string | Types.ObjectId,
    updateData: Partial<CompleteProfileDto>,
  ): Promise<UserProfile> {
    const profile = await this.userProfileModel
      .findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .exec();

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async deleteProfile(userId: string | Types.ObjectId): Promise<void> {
    await this.userProfileModel.deleteOne({ userId }).exec();
  }

  async isProfileCompleted(userId: string | Types.ObjectId): Promise<boolean> {
    const profile = await this.userProfileModel.findOne({ userId }).exec();
    return !!profile;
  }
}
