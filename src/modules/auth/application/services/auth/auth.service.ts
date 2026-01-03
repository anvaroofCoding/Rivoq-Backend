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
import { CompleteProfileDto } from '../../dto/complete-profile.dto.js';
import {
  OtpChannel,
  OtpPurpose,
} from '../../../../../shared/application/dto/otp.dto.js';
import { VerifyOtpDto } from '../../dto/verifyotp.dto.js';
import { ResendOtpDto } from '../../dto/resendotp.dto.js';
import { ForgotPasswordDto } from '../../dto/forgot-password.dto.js';
import { ResetPasswordDto } from '../../dto/reset-password.dto.js';

import { getBcryptSaltRounds } from '../../../../../config/env.config.js';
import { normalizeEmail } from '../../../../../shared/utils/normalize.utils.js';
import { BadRequestError } from '../../../../../shared/utils/error.utils.js';
import { parseDeviceInfo } from '../../../../../shared/utils/device.utils.js';

import { OtpService } from '../../../../../shared/infrastructure/services/otp.service.js';
import { TokenService } from '../../../../../shared/infrastructure/services/token.service.js';
import { SessionService } from '../../../../session/application/services/session.service.js';
import { UserProfileService } from '../../../../users/application/services/user-profile.service.js';

import {
  GitHubUser,
  GoogleUser,
} from '../../../../../shared/application/interfaces/repository.interface.js';

@Injectable()
export class AuthService {
  private readonly bcryptSaltRounds: ReturnType<typeof getBcryptSaltRounds>;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly userProfileService: UserProfileService,
    private readonly configService: ConfigService,
  ) {
    this.bcryptSaltRounds = getBcryptSaltRounds(this.configService);
  }

  async register(registerDto: RegisterDto) {
    try {
      const normalizedEmailAddress = normalizeEmail(registerDto.email);

      const existingUser = await this.userModel.findOne({
        email: normalizedEmailAddress,
      });
      if (existingUser) {
        throw new BadRequestException(
          `This email ${normalizedEmailAddress} is already registered. Please use a different email or login!`,
        );
      }

      const hashedPassword = await bcrypt.hash(
        registerDto.password,
        this.bcryptSaltRounds.password_bcrypt_salt_rounds,
      );

      await this.userModel.create({
        email: normalizedEmailAddress,
        password: hashedPassword,
        status: 'inactive',
        role: 'student',
        provider: 'local',
        isProfileCompleted: false,
      });

      await this.otpService.sendOTP({
        identifier: String(normalizedEmailAddress),
        purpose: OtpPurpose.REGISTRATION,
        channel: OtpChannel.email,
        metadata: { action: 'user-registration' },
      });

      return {
        message: `Registration successful! ✅ An OTP code has been sent to ${normalizedEmailAddress}. Please activate your account.`,
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

  async googleLogin(googleUser: GoogleUser, userAgent: string, ip: string) {
    try {
      let user = await this.userModel.findOne({
        googleId: googleUser.googleId,
      });

      if (!user) {
        user = await this.userModel.findOne({
          email: googleUser.email,
        });

        if (user) {
          user.googleId = googleUser.googleId;
          user.firstName = googleUser.firstName;
          user.lastName = googleUser.lastName;
          user.photo = googleUser.photo || user.photo;
          user.provider = 'google';
          user.status = 'active';
          await user.save();
        } else {
          user = await this.userModel.create({
            googleId: googleUser.googleId,
            email: googleUser.email,
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            photo: googleUser.photo,
            provider: 'google',
            status: 'active',
            role: 'student',
            isProfileCompleted: false,
          });
        }
      }

      const tokenPayload = {
        userId: user._id.toString(),
        email: user.email,
      };

      const accessToken =
        await this.tokenService.generateAccessToken(tokenPayload);
      const refreshToken =
        await this.tokenService.generateRefreshToken(tokenPayload);

      const deviceInfo = parseDeviceInfo(userAgent, ip);

      const session = await this.sessionService.createSession({
        userId: user._id.toString(),
        accessToken,
        refreshToken,
        deviceInfo,
        ip,
      });

      return {
        message: user.isProfileCompleted
          ? 'Successfully logged in with Google!'
          : 'Successfully logged in with Google! Please complete your profile.',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          photo: user.photo,
          role: user.role,
          provider: user.provider,
          isProfileCompleted: user.isProfileCompleted,
        },
        device: {
          deviceName: deviceInfo.deviceName,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          loginAt: session.loginAt,
        },
      };
    } catch (error) {
      throw new BadRequestError(`Google login failed: ${error}`);
    }
  }

  async githubLogin(githubUser: GitHubUser, userAgent: string, ip: string) {
    try {
      let user = await this.userModel.findOne({
        githubId: githubUser.githubId,
      });

      if (!user) {
        user = await this.userModel.findOne({
          email: githubUser.email,
        });

        if (user) {
          user.githubId = githubUser.githubId;
          user.firstName = githubUser.firstName;
          user.lastName = githubUser.lastName;
          user.photo = githubUser.photo || user.photo;
          user.provider = 'github';
          user.status = 'active';
          await user.save();
        } else {
          user = await this.userModel.create({
            githubId: githubUser.githubId,
            email: githubUser.email,
            firstName: githubUser.firstName,
            lastName: githubUser.lastName,
            photo: githubUser.photo,
            provider: 'github',
            status: 'active',
            role: 'student',
            isProfileCompleted: false,
          });
        }
      }

      const tokenPayload = {
        userId: user._id.toString(),
        email: user.email,
      };

      const accessToken =
        await this.tokenService.generateAccessToken(tokenPayload);
      const refreshToken =
        await this.tokenService.generateRefreshToken(tokenPayload);

      const deviceInfo = parseDeviceInfo(userAgent, ip);

      const session = await this.sessionService.createSession({
        userId: user._id.toString(),
        accessToken,
        refreshToken,
        deviceInfo,
        ip,
      });

      return {
        message: user.isProfileCompleted
          ? 'Successfully logged in with GitHub!'
          : 'Successfully logged in with GitHub! Please complete your profile.',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          photo: user.photo,
          role: user.role,
          provider: user.provider,
          isProfileCompleted: user.isProfileCompleted,
        },
        device: {
          deviceName: deviceInfo.deviceName,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          loginAt: session.loginAt,
        },
      };
    } catch (error) {
      throw new BadRequestError(`GitHub login failed: ${error}`);
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const normalizedEmailAddress = normalizeEmail(forgotPasswordDto.email);

      const user = await this.userModel.findOne({
        email: normalizedEmailAddress,
      });
      if (!user) {
        throw new NotFoundException(
          `User with email ${normalizedEmailAddress} not found!`,
        );
      }

      if (user.provider !== 'local') {
        throw new BadRequestException(
          `This account is linked with ${user.provider}. Please use ${user.provider} to login.`,
        );
      }

      await this.otpService.sendOTP({
        identifier: String(normalizedEmailAddress),
        purpose: OtpPurpose.PASSWORD_RESET,
        channel: OtpChannel.email,
        metadata: { action: 'password-reset' },
      });

      return {
        message: `OTP code has been sent to ${normalizedEmailAddress}. Please check your email.`,
      };
    } catch (error) {
      throw new BadRequestError(`${error}`);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const normalizedEmail = normalizeEmail(resetPasswordDto.email);

      const user = await this.userModel.findOne({ email: normalizedEmail });
      if (!user) {
        throw new NotFoundException(
          `User with email ${normalizedEmail} not found!`,
        );
      }

      if (user.provider !== 'local') {
        throw new BadRequestException(
          `This account is linked with ${user.provider}. Please use ${user.provider} to login.`,
        );
      }

      const isValidOtp = await this.otpService.verifyOTP({
        identifier: String(normalizedEmail),
        code: resetPasswordDto.code,
        purpose: OtpPurpose.PASSWORD_RESET,
      });

      if (!isValidOtp) {
        throw new BadRequestException('Invalid or expired OTP code!');
      }

      if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
        throw new BadRequestException(
          'New password and confirm password do not match!',
        );
      }

      const hashedPassword = await bcrypt.hash(
        resetPasswordDto.newPassword,
        this.bcryptSaltRounds.password_bcrypt_salt_rounds,
      );

      user.password = hashedPassword;
      await user.save();

      await this.sessionService.deleteAllUserSessions(user._id.toString());

      return {
        message:
          'Password reset successfully! All sessions have been terminated. Please login with your new password.',
      };
    } catch (error) {
      throw new BadRequestError(`${error}`);
    }
  }

  async completeProfile(
    userId: string,
    completeProfileDto: CompleteProfileDto,
  ) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found!');
      }

      if (user.isProfileCompleted) {
        throw new BadRequestException(
          'Your profile is already completed. If you want to modify it, please go to profile settings.',
        );
      }

      if (user.status !== 'active') {
        throw new ForbiddenException(
          'Please activate your account first (via OTP verification).',
        );
      }

      await this.userProfileService.createProfile(userId, completeProfileDto);

      user.isProfileCompleted = true;
      await user.save();

      return {
        message: 'Your profile has been completed successfully! ✅',
        isProfileCompleted: true,
      };
    } catch (error) {
      throw new BadRequestError(`${error}`);
    }
  }
}
