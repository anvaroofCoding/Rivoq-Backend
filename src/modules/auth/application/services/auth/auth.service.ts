import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
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
import { OtpService } from '../../../../../shared/infrastructure/services/otp.service.js';
import {
  OtpChannel,
  OtpPurpose,
} from '../../../../../shared/application/dto/otp.dto.js';
import { TokenService } from '../../../../../shared/infrastructure/services/token.service.js';
import { getBcryptSaltRounds } from '../../../../../config/env.config.js';

@Injectable()
export class AuthService {
  private readonly bcryptSaltRounds: ReturnType<typeof getBcryptSaltRounds>;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {
    this.bcryptSaltRounds = getBcryptSaltRounds(this.configService);
  }

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
        this.bcryptSaltRounds,
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
      throw new BadRequestException(
        `An error occured while registering a new user: ${error}. Please try again`,
      );
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const existingUser = await this.userModel.findOne({
        email: loginDto.email,
      });

      if (!existingUser)
        throw new NotFoundException('User with this email address not found!');

      if (existingUser?.status === 'inactive') {
        throw new ForbiddenException('You should activate your account!');
      }

      const comparePassword = bcrypt.compareSync(
        loginDto.password,
        existingUser?.password,
      );
      console.log(comparePassword);

      if (!comparePassword) throw new BadRequestException('Wrong Password!');

      const tokenPayload = {
        userId: existingUser._id.toString(),
        email: existingUser.email,
      };

      const accessToken =
        await this.tokenService.generateAccessToken(tokenPayload);
      const refreshToken =
        await this.tokenService.generateRefreshToken(tokenPayload);

      return {
        message: 'Login successful!',
        accessToken,
        refreshToken,
        user: {
          id: existingUser._id,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          email: existingUser.email,
          role: existingUser.role,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `An error occured while logging in to system: ${error}. Please try again`,
      );
    }
  }
}
