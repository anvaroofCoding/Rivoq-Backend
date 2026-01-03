import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { AuthService } from '../../application/services/auth/auth.service.js';
import { getClientIp } from '../../../../shared/utils/device.utils.js';
import { GoogleAuthGuard } from '../../guards/google-auth.guard.js';
import { GitHubAuthGuard } from '../../guards/github-auth.guard.js';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';

import { LoginDto } from '../../application/dto/login.dto.js';
import { RegisterDto } from '../../application/dto/register.dto.js';
import { CompleteProfileDto } from '../../application/dto/complete-profile.dto.js';
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
  @ApiOperation({
    summary: 'User Registration',
    description:
      'Register a new user with email and password. After successful registration, an OTP code will be sent to the provided email for account verification.',
  })
  @ApiResponse({
    status: 201,
    description: 'Registration successful. OTP sent to email.',
    schema: {
      example: {
        message:
          'Registration successful! ✅ An OTP code has been sent to user@example.com. Please activate your account.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Email already registered or validation failed',
    schema: {
      example: {
        statusCode: 400,
        message:
          'This email user@example.com is already registered. Please use a different email or login!',
        error: 'Bad Request',
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return await this.service.register(registerDto);
  }

  @Post('verify-registration-otp')
  @ApiOperation({
    summary: 'Verify Registration OTP',
    description:
      'Verify the OTP code sent to email during registration. This activates the user account and allows login.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully. Account activated.',
    schema: {
      example: {
        message: 'Your account verified successfully. ✅',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid OTP code',
    schema: {
      example: {
        statusCode: 400,
        message: 'Wrong OTP Code!',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User with this email not found',
    schema: {
      example: {
        statusCode: 404,
        message:
          'User with this email@example.com not found or wrong email address!',
        error: 'Not Found',
      },
    },
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return await this.service.verifyRegistrationOtp(verifyOtpDto);
  }

  @Post('resend-registration-otp')
  @ApiOperation({
    summary: 'Resend Registration OTP',
    description:
      'Resend OTP code to email if the previous code expired or was not received. Can only be used for inactive accounts.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP resent successfully',
    schema: {
      example: {
        message: 'OTP Code has been resent successfully for verification',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Account already verified',
    schema: {
      example: {
        statusCode: 400,
        message: 'User account is already verified. No need to resend OTP Code',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User not found',
    schema: {
      example: {
        statusCode: 404,
        message:
          'User with this email@example.com not found or wrong email address!',
        error: 'Not Found',
      },
    },
  })
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return await this.service.resendRegistrationOtp(resendOtpDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'User Login',
    description:
      'Login with email and password. Returns access token, refresh token, and device information. Account must be active (OTP verified).',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        device: {
          deviceName: 'Chrome on Windows 10',
          browser: 'Chrome',
          os: 'Windows 10',
          loginAt: '2024-01-03T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Wrong password',
    schema: {
      example: {
        statusCode: 400,
        message: 'Wrong Password!',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Account not activated',
    schema: {
      example: {
        statusCode: 403,
        message: 'You should activate your account!',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User with this email@example.com not found!',
        error: 'Not Found',
      },
    },
  })
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const ip = getClientIp(request);

    return await this.service.login(loginDto, userAgent, ip);
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout from Current Device',
    description:
      'Logout from the current device by terminating the session associated with the provided access token. Requires Bearer token in Authorization header.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      example: {
        message: 'Logout successful. Session terminated.',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Token not found. Please login to continue.',
        error: 'Unauthorized',
      },
    },
  })
  async logout(@Headers('authorization') authorization: string) {
    const token = authorization?.replace('Bearer ', '') || '';

    return await this.service.logout(token);
  }

  @Post('logout-all-devices')
  @ApiOperation({
    summary: 'Logout from All Devices',
    description:
      'Terminate all active sessions for the user across all devices. This is useful for security purposes when user suspects unauthorized access.',
  })
  @ApiResponse({
    status: 200,
    description: 'All sessions terminated successfully',
    schema: {
      example: {
        message: 'All sessions have been terminated successfully.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid user ID',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid user ID',
        error: 'Bad Request',
      },
    },
  })
  async logoutAllDevices(@Body('userId') userId: string) {
    return await this.service.logoutAllDevices(userId);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Forgot Password',
    description:
      'Request a password reset by sending an OTP code to the registered email. Only works for local authentication (not OAuth accounts).',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset OTP sent successfully',
    schema: {
      example: {
        message:
          'OTP code has been sent to user@example.com. Please check your email.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - OAuth account cannot reset password',
    schema: {
      example: {
        statusCode: 400,
        message:
          'This account is linked with google. Please use google to login.',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User with email user@example.com not found!',
        error: 'Not Found',
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.service.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset Password',
    description:
      'Reset password using OTP code received via email. All active sessions will be terminated after successful password reset.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    schema: {
      example: {
        message:
          'Password reset successfully! All sessions have been terminated. Please login with your new password.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid OTP or password mismatch',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid or expired OTP code!',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User with email user@example.com not found!',
        error: 'Not Found',
      },
    },
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.service.resetPassword(resetPasswordDto);
  }

  @Post('complete-profile')
  @ApiOperation({
    summary: 'Complete User Profile',
    description:
      'Complete user profile after registration or OAuth login. Requires JWT authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile completed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Profile already completed or validation failed',
  })
  @UseGuards(JwtAuthGuard)
  async completeProfile(
    @Body() completeProfileDto: CompleteProfileDto,
    @Req() request: Request,
  ) {
    const user = request.user as { userId: string; email: string };
    return await this.service.completeProfile(user.userId, completeProfileDto);
  }

  @Get('google')
  @ApiOperation({
    summary: 'Initiate Google OAuth Login',
    description:
      'Initiates Google OAuth 2.0 authentication flow. Redirects user to Google consent screen where they can authorize the application. After authorization, Google will redirect back to the callback URL with user profile information. This endpoint should be opened in a browser, not called via API.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth consent screen',
    schema: {
      example: {
        message: 'Redirecting to Google...',
        url: 'https://accounts.google.com/o/oauth2/v2/auth?...',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error - OAuth configuration error',
    schema: {
      example: {
        statusCode: 500,
        message: 'OAuth configuration error',
        error: 'Internal Server Error',
      },
    },
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
    summary: 'Initiate GitHub OAuth Login',
    description:
      'Initiates GitHub OAuth 2.0 authentication flow. Redirects user to GitHub authorization page where they can authorize the application. After authorization, GitHub will redirect back to the callback URL with user profile information. This endpoint should be opened in a browser, not called via API.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to GitHub OAuth authorization page',
    schema: {
      example: {
        message: 'Redirecting to GitHub...',
        url: 'https://github.com/login/oauth/authorize?...',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error - OAuth configuration error',
    schema: {
      example: {
        statusCode: 500,
        message: 'OAuth configuration error',
        error: 'Internal Server Error',
      },
    },
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
