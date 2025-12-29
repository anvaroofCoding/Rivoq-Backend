import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from '../../application/services/auth/auth.service.js';
import { getClientIp } from '../../../../shared/utils/device.utils.js';
import { GoogleAuthGuard } from '../../guards/google-auth.guard.js';
import { GitHubAuthGuard } from '../../guards/github-auth.guard.js';

import { LoginDto } from '../../application/dto/login.dto.js';
import { RegisterDto } from '../../application/dto/register.dto.js';
import { VerifyOtpDto } from '../../application/dto/verifyotp.dto.js';
import { ResendOtpDto } from '../../application/dto/resendotp.dto.js';
import { ForgotPasswordDto } from '../../application/dto/forgot-password.dto.js';
import { ResetPasswordDto } from '../../application/dto/reset-password.dto.js';
import {
  GoogleUser,
  GitHubUser,
} from '../../../../shared/application/interfaces/repository.interface.js';

@ApiTags('Authorization')
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

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.service.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.service.resetPassword(resetPasswordDto);
  }

  @Get('google')
  @ApiOperation({
    summary: 'Google OAuth Login',
    description:
      'Redirects to Google login page. Open this URL in browser: https://rivoq-backend.onrender.com/auth/google',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth',
  })
  @UseGuards(GoogleAuthGuard)
  async googleLogin() {}

  @Get('google/callback')
  @ApiExcludeEndpoint()
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() request: Request) {
    const user = request.user as GoogleUser;

    const userAgent = request.headers['user-agent'] || 'Unknown';
    const ip = getClientIp(request);

    return await this.service.googleLogin(user, userAgent, ip);
  }

  @Get('github')
  @ApiOperation({
    summary: 'GitHub OAuth Login',
    description:
      'Redirects to GitHub login page. Open this URL in browser: https://rivoq-backend.onrender.com/auth/github',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to GitHub OAuth',
  })
  @UseGuards(GitHubAuthGuard)
  async githubLogin() {}

  @Get('github/callback')
  @ApiExcludeEndpoint()
  @UseGuards(GitHubAuthGuard)
  async githubCallback(@Req() request: Request) {
    const user = request.user as GitHubUser;

    const userAgent = request.headers['user-agent'] || 'Unknown';
    const ip = getClientIp(request);

    return await this.service.githubLogin(user, userAgent, ip);
  }
}
