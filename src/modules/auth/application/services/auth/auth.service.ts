import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';

import {
  User,
  UserDocument,
} from '../../../../users/infrastructure/persistence/user.schema.js';
import { RegisterDto } from '../../dto/register.dto.js';
import { LoginDto } from '../../dto/login.dto.js';
import {
  normalizeEmail,
  normalizePhoneNumber,
} from '../../../../../shared/utils/normalize.utils.js';
import { BadRequestError } from '../../../../../shared/utils/error.utils.js';
import { OtpService } from '../../../../../shared/infrastructure/services/otp.service.js';
import {
  OtpChannel,
  OtpPurpose,
} from '../../../../../shared/application/dto/otp.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly otpService: OtpService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const normalizedEmailAddress = registerDto.email
        ? normalizeEmail(registerDto.email)
        : undefined;
      const normalizedPhoneNumber = registerDto.phoneNumber
        ? normalizePhoneNumber(registerDto.phoneNumber)
        : undefined;

      const identifier = normalizedEmailAddress || normalizedPhoneNumber;
      const channel: OtpChannel = normalizedEmailAddress
        ? OtpChannel.email
        : OtpChannel.sms;

      const existingUser = await this.userModel.findOne({
        email: normalizedEmailAddress,
      });
      if (existingUser) {
        return {
          message: `This ${identifier} is already registered. Please use different email address!`,
        };
      }

      const hashedPassword = await bcrypt.hash(
        registerDto.password,
        parseInt(process.env.PASSWORD_BCRYPT_SALT_ROUNDS || '10') || 10,
      );

      await this.userModel.create({
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        instagramUsername: registerDto.instagramUsername,
        telegramUsername: registerDto.telegramUsername,
        email: normalizedEmailAddress,
        phoneNumber: normalizedPhoneNumber,
        password: hashedPassword,
        role: registerDto.role,
        status: 'pending',
      });

      await this.otpService.sendOTP({
        identifier: String(identifier),
        purpose: OtpPurpose.REGISTRATION,
        channel: channel,
        metadata: { action: 'user-registration' },
      });

      return {
        message: `Registered successfully ✅. We sent an OTP-CODE to your ${identifier}, Please activate your account`,
      };
    } catch (error) {
      throw new BadRequestError(
        `An error occured while registering a new user: ${error}. Please try again`,
      );
    }
  }

  login(loginDto: LoginDto) {
    try {
      console.log(loginDto);
    } catch (error) {
      console.log(error);
    }
  }
}
