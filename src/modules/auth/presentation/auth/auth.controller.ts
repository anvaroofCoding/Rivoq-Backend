import { Body, Controller, Post, Req, Headers } from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from '../../application/services/auth/auth.service.js';
import { getClientIp } from '../../../../shared/utils/device.utils.js';

import { LoginDto } from '../../application/dto/login.dto.js';
import { RegisterDto } from '../../application/dto/register.dto.js';
import { VerifyOtpDto } from '../../application/dto/verifyotp.dto.js';
import { ResendOtpDto } from '../../application/dto/resendotp.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.service.register(registerDto);
  }

  @Post('verify-registration-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return await this.service.verifyRegistrationOtp(verifyOtpDto);
  }

  @Post('resend-registration-otp')
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return await this.service.resendRegistrationOtp(resendOtpDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const ip = getClientIp(request);

    return await this.service.login(loginDto, userAgent, ip);
  }

  @Post('logout')
  async logout(@Headers('authorization') authorization: string) {
    const token = authorization?.replace('Bearer ', '') || '';

    return await this.service.logout(token);
  }

  @Post('logout-all-devices')
  async logoutAllDevices(@Body('userId') userId: string) {
    return await this.service.logoutAllDevices(userId);
  }
}
