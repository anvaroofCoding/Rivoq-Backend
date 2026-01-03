import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';

import {
  Otp,
  OtpDocument,
} from '../../../modules/otp/infrastructure/persistence/otp.schema.js';
import { MailService } from './email.service.js';

import {
  TooManyRequestsError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
  ServiceUnavailableError,
} from '../../utils/error.utils.js';
import { generateOtpCode } from '../../utils/generate-otp.utils.js';

import { CreateOtpDto } from '../../../modules/otp/application/dto/otp.create.js';
import { OtpChannel, OtpPurpose } from '../../application/dto/otp.dto.js';
import { VerifyOtpDto } from '../../../modules/otp/application/dto/otp.verify.js';

import { getOtpConfig } from '../../../config/env.config.js';

@Injectable()
export class OtpService {
  private readonly otpConfig: ReturnType<typeof getOtpConfig>;

  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.otpConfig = getOtpConfig(this.configService);
  }

  async sendOTP(
    createOtpDto: CreateOtpDto,
  ): Promise<{ message: string; expiresAt: Date }> {
    try {
      const { identifier, purpose, channel, metadata = {} } = createOtpDto;

      await this.checkRateLimit(identifier, purpose);

      await this.otpModel.deleteMany({
        identifier: identifier.toLowerCase(),
        purpose,
      });

      const code = generateOtpCode();

      const expiresAt = new Date();
      expiresAt.setMinutes(
        expiresAt.getMinutes() + this.otpConfig.expiryMinutes,
      );

      const otpData = {
        identifier: identifier.toLowerCase(),
        code,
        purpose,
        channel,
        expiresAt,
        isVerified: false,
        attemptCount: 0,
        maxAttempts: this.otpConfig.maxAttempts,
        metadata,
      };

      await this.otpModel.create(otpData);

      if (channel === OtpChannel.email) {
        await this.sendOTPByEmail(identifier, code, purpose);
      } else if (channel === OtpChannel.sms) {
        throw new BadRequestError('SMS service is not available yet');
      }

      const channelName =
        channel === OtpChannel.email ? 'email address' : 'phone number';

      return {
        message: `OTP code has been successfully sent to your ${channelName}. The code will expire in ${this.otpConfig.expiryMinutes} minutes.`,
        expiresAt,
      };
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof TooManyRequestsError
      ) {
        throw error;
      }
      throw new BadRequestError(
        `Failed to send OTP code. Please try again later.`,
      );
    }
  }

  async verifyOTP(verifyOtpDto: VerifyOtpDto): Promise<{
    success: boolean;
    message: string;
  }> {
    const { identifier, code, purpose } = verifyOtpDto;

    const otp = await this.otpModel.findOne({
      identifier: identifier.toLowerCase(),
      purpose,
      isVerified: false,
    });

    if (!otp) {
      throw new NotFoundError(
        'OTP code not found or has expired. Please request a new code.',
      );
    }

    if (new Date() > otp.expiresAt) {
      await this.otpModel.deleteOne({ _id: otp._id });
      throw new UnauthorizedError(
        'OTP code has expired. Please request a new code.',
      );
    }

    if (otp.attemptCount >= otp.maxAttempts) {
      await this.otpModel.deleteOne({ _id: otp._id });
      throw new TooManyRequestsError(
        'Maximum verification attempts exceeded. Please request a new code.',
      );
    }

    if (otp.code !== code) {
      otp.attemptCount += 1;
      await otp.save();

      const remainingAttempts = otp.maxAttempts - otp.attemptCount;
      throw new UnauthorizedError(
        `Invalid OTP code. ${remainingAttempts} attempt(s) remaining.`,
      );
    }

    otp.isVerified = true;
    await otp.save();

    return {
      success: true,
      message: 'OTP code verified successfully',
    };
  }

  async resendOTP(createOtpDto: CreateOtpDto): Promise<{
    message: string;
    expiresAt: Date;
  }> {
    return await this.sendOTP(createOtpDto);
  }

  async deleteOTP(identifier: string, purpose: OtpPurpose): Promise<void> {
    await this.otpModel.deleteMany({
      identifier: identifier.toLowerCase(),
      purpose,
    });
  }

  private async checkRateLimit(
    identifier: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    const rateLimitMs = this.otpConfig.rateLimitMinutes * 60 * 1000;

    const recentOtp = await this.otpModel.findOne({
      identifier: identifier.toLowerCase(),
      purpose,
      createdAt: {
        $gte: new Date(Date.now() - rateLimitMs),
      },
    });

    if (recentOtp) {
      const timeElapsed = Date.now() - recentOtp.createdAt.getTime();
      const waitTime = Math.ceil((rateLimitMs - timeElapsed) / 1000);

      throw new TooManyRequestsError(
        `Too many OTP requests. Please try again in ${waitTime} seconds.`,
      );
    }
  }

  private async sendOTPByEmail(
    email: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    try {
      const subject = this.getEmailSubject(purpose);
      const htmlContent = this.getEmailTemplate(code);

      await this.mailService.sendMail(email, subject, htmlContent);
    } catch (error) {
      throw new ServiceUnavailableError(
        `Failed to send email to ${email}. Please try again later: ${error}`,
      );
    }
  }

  private getEmailSubject(purpose: OtpPurpose): string {
    const subjects = {
      [OtpPurpose.REGISTRATION]: "Ro'yxatdan o'tish uchun OTP kod",
      [OtpPurpose.LOGIN]: 'Tizimga kirish uchun OTP kod',
      [OtpPurpose.PASSWORD_RESET]: "Parolni o'zgartirish uchun OTP kod",
      [OtpPurpose.EMAIL_VERIFICATION]: 'Emailni tasdiqlash uchun OTP kod',
      [OtpPurpose.PHONE_VERIFICATION]:
        'Telefon raqamni tasdiqlash uchun OTP kod',
      [OtpPurpose.RESEND_OTP_CODE]: 'OTP kodni qayta olish uchun',
    };
    return subjects[purpose] || 'Sizning OTP kodingiz';
  }

  private getEmailTemplate(code: string): string {
    const otpExpiryMinutes = this.otpConfig.expiryMinutes;

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background-color: #f5f5f5;
              padding: 20px;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              border: 1px solid #e0e0e0;
              overflow: hidden;
            }
            .email-content {
              padding: 40px 30px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 24px;
              color: #333333;
              font-weight: 600;
              text-align: center;
              margin: 0;
            }
            .greeting {
              font-size: 16px;
              color: #333333;
              margin-bottom: 15px;
            }
            .description {
              font-size: 14px;
              color: #666666;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .otp-box {
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 48px;
              font-weight: 700;
              letter-spacing: 8px;
              color: #4caf50;
              font-family: 'Courier New', monospace;
            }
            .important-section {
              margin: 30px 0;
            }
            .important-title {
              font-size: 14px;
              font-weight: 600;
              color: #333333;
              margin-bottom: 12px;
            }
            .important-list {
              padding-left: 0;
            }
            .important-list li {
              font-size: 14px;
              color: #4f4f4f;
              margin-bottom: 8px;
              position: relative;
            }
            .important-list li:before {
              content: "•";
              position: absolute;
              left: 0;
              color: #4f4f4f;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              padding-top: 30px;
              border-top: 1px solid #e0e0e0;
              margin-top: 30px;
            }
            .footer p {
              font-size: 12px;
              color: #7d7d7d;
              line-height: 19px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-content">
              <!-- Header -->
              <div class="header">
                <h1 style="text-align: center">🔐 Sizning OTP kodingiz</h1>
              </div>

              <!-- Greeting -->
              <p class="greeting">Assalomu alaykum!</p>

              <!-- Description -->
              <p class="description">
                <strong>Rivoq</strong> hisobingiz uchun bir martalik parol (OTP) so‘radingiz. Mana sizning tasdiqlash kodingiz:
              </p>

              <!-- OTP Code Box -->
              <div class="otp-box">
                <div class="otp-code">${code}</div>
              </div>

              <!-- Important Section -->
              <div class="important-section">
                <p class="important-title">Xavfsizlik uchun judaham muhim bo'lgan qoidalar:</p>
                <ul class="important-list">
                  <li>Ushbu kodning amal qilish muddati <strong>${otpExpiryMinutes}</strong> daqiqada tugaydi</li>
                  <li>Ushbu kodni hech kimga ulashmang</li>
                  <li>Agar siz ushbu kodni so'ramagan bo'lsangiz, iltimos, ushbu elektron pochta xabarini e'tiborsiz qoldiring</li>
                </ul>
              </div>

              <!-- Footer -->
              <div class="footer">
                <p>Ushbu elektron pochta xabarini <strong>Rivoq</strong> yubordi</p>
                <p>Agar biron bir savolingiz bo'lsa, iltimos, bizning qo'llab-quvvatlash guruhimizga murojaat qiling.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async checkOTPStatus(
    identifier: string,
    purpose: OtpPurpose,
  ): Promise<{
    exists: boolean;
    expiresAt?: Date;
    attemptsLeft?: number;
  }> {
    const otp = await this.otpModel.findOne({
      identifier: identifier.toLowerCase(),
      purpose,
      isVerified: false,
    });

    if (!otp) {
      return { exists: false };
    }

    return {
      exists: true,
      expiresAt: otp.expiresAt,
      attemptsLeft: otp.maxAttempts - otp.attemptCount,
    };
  }
}
