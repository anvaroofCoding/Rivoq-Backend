import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import {
  User,
  UserDocument,
} from '../../infrastructure/persistence/user.schema.js';

import { CreateAdminDto } from '../dto/create-admin.js';
import { UserRole } from '../../../../shared/application/dto/auth.dto.js';

import { BadRequestError } from '../../../../shared/utils/error.utils.js';
import { normalizeEmail } from '../../../../shared/utils/normalize.utils.js';

import { getBcryptSaltRounds } from '../../../../config/env.config.js';

@Injectable()
export class UserService {
  private readonly bcryptSaltRounds: ReturnType<typeof getBcryptSaltRounds>;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {
    this.bcryptSaltRounds = getBcryptSaltRounds(this.configService);
  }

  async createAdmin(createAdminDto: CreateAdminDto) {
    try {
      const normalizedEmailAddress = normalizeEmail(createAdminDto.email);

      const existingUser = await this.userModel.findOne({
        email: normalizedEmailAddress,
      });
      if (existingUser) {
        throw new BadRequestException(
          `This ${normalizedEmailAddress} is already exists!`,
        );
      }

      if (createAdminDto.role !== UserRole.admin) {
        throw new BadRequestException(
          `You are not allowed to assign this role!`,
        );
      }

      const hashedPassword = await bcrypt.hash(
        createAdminDto.password,
        this.bcryptSaltRounds.password_bcrypt_salt_rounds,
      );

      await this.userModel.create({
        ...createAdminDto,
        password: hashedPassword,
        email: normalizedEmailAddress,
        role: 'admin',
        status: 'active',
      });

      return { message: 'Admin created successfully' };
    } catch (error) {
      throw new BadRequestError(`${error}`);
    }
  }
}
