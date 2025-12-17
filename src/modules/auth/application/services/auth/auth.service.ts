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
  OtpChannel,
  OtpPurpose,
} from '../../../../../shared/application/dto/otp.dto.js';
import { VerifyOtpDto } from '../../dto/verifyotp.dto.js';
import { ResendOtpDto } from '../../dto/resendotp.dto.js';

import { getBcryptSaltRounds } from '../../../../../config/env.config.js';
import {
  normalizeEmail,
  normalizePhoneNumber,
} from '../../../../../shared/utils/normalize.utils.js';
import { BadRequestError } from '../../../../../shared/utils/error.utils.js';
import { parseDeviceInfo } from '../../../../../shared/utils/device.utils.js';

import { OtpService } from '../../../../../shared/infrastructure/services/otp.service.js';
import { TokenService } from '../../../../../shared/infrastructure/services/token.service.js';
import { SessionService } from '../../../../session/application/services/session.service.js';

@Injectable()
export class AuthService {
  private readonly bcryptSaltRounds: ReturnType<typeof getBcryptSaltRounds>;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
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
          message: `This ${identifier} is already registered. Please use different email address or login to system!`,
        };
      }

      const hashedPassword = await bcrypt.hash(
        registerDto.password,
        this.bcryptSaltRounds.password_bcrypt_salt_rounds,
      );

      await this.userModel.create({
        ...registerDto,
        password: hashedPassword,
        email: normalizedEmailAddress,
        phoneNumber: normalizedPhoneNumber,
        status: 'inactive',
        role: 'student',
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
      throw new BadRequestError(`${error}`);
    }
  }

  async verifyRegistrationOtp(verifyOtpDto: VerifyOtpDto) {
    try {
      const findUser = await this.userModel.findOne({
        email: verifyOtpDto.email,
      });
      if (!findUser) {
        throw new NotFoundException(
          `User with this ${verifyOtpDto.email} not found or wrong email address!`,
        );
      }

      const checkOtpCode = await this.otpService.verifyOTP({
        identifier: String(verifyOtpDto.email),
        code: verifyOtpDto.code,
        purpose: OtpPurpose.REGISTRATION,
      });
      if (!checkOtpCode) {
        throw new BadRequestException(`Wrong OTP Code!`);
      }

      if (findUser?.status === 'inactive') {
        await this.userModel.findOneAndUpdate(
          { email: verifyOtpDto.email },
          { status: 'active' },
        );
      }

      return { message: 'Your account verified successfully. ✅' };
    } catch (error) {
      throw new BadRequestError(`${error}`);
    }
  }

  async resendRegistrationOtp(resendOtpDto: ResendOtpDto) {
    try {
      const findUser = await this.userModel.findOne({
        email: resendOtpDto.email,
      });
      if (!findUser) {
        throw new NotFoundException(
          `User with this ${resendOtpDto.email} not found or wrong email address!`,
        );
      }

      if (findUser?.status === 'active') {
        throw new BadRequestException(
          `User account is already verified. No need to resend OTP Code`,
        );
      }

      await this.otpService.resendOTP({
        identifier: String(resendOtpDto.email),
        purpose: OtpPurpose.REGISTRATION,
        channel: OtpChannel.email,
        metadata: { action: 'user-resend-registration-otp' },
      });

      return {
        message: 'OTP Code has been resent successfully for verification',
      };
    } catch (error) {
      throw new BadRequestError(`${error}`);
    }
  }

  async login(loginDto: LoginDto, userAgent: string, ip: string) {
    try {
      const existingUser = await this.userModel.findOne({
        email: loginDto.email,
      });
      if (!existingUser)
        throw new NotFoundException(
          `User with this ${loginDto.email} not found!`,
        );

      const comparePassword = bcrypt.compareSync(
        loginDto.password,
        existingUser?.password,
      );
      if (!comparePassword) throw new BadRequestException('Wrong Password!');

      if (existingUser?.status === 'inactive') {
        throw new ForbiddenException('You should activate your account!');
      }

      const tokenPayload = {
        userId: existingUser._id.toString(),
        email: existingUser.email,
      };

      const accessToken =
        await this.tokenService.generateAccessToken(tokenPayload);
      const refreshToken =
        await this.tokenService.generateRefreshToken(tokenPayload);

      const deviceInfo = parseDeviceInfo(userAgent, ip);

      const session = await this.sessionService.createSession({
        userId: existingUser._id.toString(),
        accessToken,
        refreshToken,
        deviceInfo,
        ip,
      });

      return {
        accessToken,
        refreshToken,
        device: {
          deviceName: deviceInfo.deviceName,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          loginAt: session.loginAt,
        },
      };
    } catch (error) {
      throw new BadRequestError(`${error}`);
    }
  }

  async logout(accessToken: string) {
    try {
      await this.sessionService.deleteSessionByToken(accessToken);

      return {
        message: 'Logout successful. Session terminated.',
      };
    } catch (error) {
      throw new BadRequestError(`${error}`);
    }
  }

  async logoutAllDevices(userId: string) {
    try {
      await this.sessionService.deleteAllUserSessions(userId);

      return {
        message: 'All sessions have been terminated successfully.',
      };
    } catch (error) {
      throw new BadRequestError(`${error}`);
    }
  }
}
