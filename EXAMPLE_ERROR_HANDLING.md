# Professional Error Handling Example

## 1. Improved OTP Service with English Messages

```typescript
// src/shared/infrastructure/services/otp.service.ts

async sendOTP(createOtpDto: CreateOtpDto): Promise<{message: string; expiresAt: Date;}> {
  try {
    const { identifier, purpose, channel, metadata = {} } = createOtpDto;

    // Check rate limit
    try {
      await this.checkRateLimit(identifier, purpose);
    } catch (error) {
      // Re-throw with clear context about which check failed
      if (error instanceof TooManyRequestsError) {
        throw new TooManyRequestsError(
          `Rate limit exceeded for ${channel}. ${error.message}`
        );
      }
      throw error;
    }

    // Delete existing OTP codes
    try {
      await this.otpModel.deleteMany({
        identifier: identifier.toLowerCase(),
        purpose,
      });
    } catch (error) {
      throw new InternalServerError(
        'Failed to clear previous OTP codes from database'
      );
    }

    // Generate OTP code
    const code = generateOtpCode();
    const otpExpiryMinutes = Number(OTP_EXPIRY_MINUTES) || 10;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + otpExpiryMinutes);

    // Save OTP to database
    try {
      await this.otpModel.create({
        identifier: identifier.toLowerCase(),
        code,
        purpose,
        channel,
        expiresAt,
        isVerified: false,
        attemptCount: 0,
        maxAttempts: Number(MAX_ATTEMPTS) || 5,
        metadata,
      });
    } catch (error) {
      throw new InternalServerError(
        'Failed to save OTP code to database. Please try again later.'
      );
    }

    // Send OTP via email or SMS
    try {
      if (channel === OtpChannel.EMAIL) {
        await this.sendOTPByEmail(identifier, code, purpose);
      } else if (channel === OtpChannel.SMS) {
        await this.sendOTPBySMS(identifier, code, purpose);
      }
    } catch (error) {
      // Clean up the OTP we just created since sending failed
      await this.otpModel.deleteMany({
        identifier: identifier.toLowerCase(),
        purpose,
      });

      // Provide clear context about which service failed
      if (channel === OtpChannel.EMAIL) {
        throw new ServiceUnavailableError(
          'Failed to send OTP email. Email service is currently unavailable. Please try again later.'
        );
      } else {
        throw new ServiceUnavailableError(
          'Failed to send OTP SMS. SMS service is currently unavailable. Please try again later.'
        );
      }
    }

    // Success message in English
    const channelName = channel === OtpChannel.EMAIL ? 'email address' : 'phone number';
    return {
      message: `OTP code has been successfully sent to your ${channelName}. The code will expire in ${otpExpiryMinutes} minutes.`,
      expiresAt,
    };

  } catch (error) {
    // If error is already one of our custom errors, re-throw it
    if (error instanceof AppError) {
      throw error;
    }

    // Otherwise, wrap in InternalServerError with context
    throw new InternalServerError(
      `Unexpected error in OtpService.sendOTP: ${error.message}`
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
    const message = this.getEmailTemplate(code, purpose);

    await this.mailService.sendMail(email, subject, message);
  } catch (error) {
    // Add context about which part of email sending failed
    throw new ServiceUnavailableError(
      `Email delivery failed to ${email}. Error: ${error.message}`
    );
  }
}
```

---

## 2. Controller with Comprehensive Error Handling

```typescript
// src/modules/auth/presentation/auth/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { AuthService } from '../../application/services/auth/auth.service.js';
import {
  AppError,
  BadRequestError,
  ConflictError,
  TooManyRequestsError,
  ServiceUnavailableError,
  InternalServerError,
} from '../../../../shared/utils/error.utils.js';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Request OTP for registration
   * POST /auth/register/request-otp
   */
  @Post('register/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestRegistrationOTP(@Body('email') email: string) {
    try {
      // Input validation
      if (!email) {
        throw new BadRequestError('Email address is required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestError('Invalid email address format');
      }

      // Try to send OTP
      const result = await this.authService.requestRegistrationOTP(email);

      // Log success for monitoring
      this.logger.log(`OTP sent successfully to ${email}`);

      return {
        success: true,
        message: result.message,
        expiresAt: result.expiresAt,
      };

    } catch (error) {
      // Log the error with full context for debugging
      this.logger.error(
        `Failed to send OTP to ${email}`,
        error.stack,
        'requestRegistrationOTP'
      );

      // Handle specific error types with user-friendly messages
      if (error instanceof ConflictError) {
        throw new ConflictError(
          'This email address is already registered. Please login instead.'
        );
      }

      if (error instanceof TooManyRequestsError) {
        throw new TooManyRequestsError(
          'Too many OTP requests. Please wait a few minutes before trying again.'
        );
      }

      if (error instanceof ServiceUnavailableError) {
        throw new ServiceUnavailableError(
          'Email service is temporarily unavailable. Please try again in a few minutes.'
        );
      }

      if (error instanceof BadRequestError) {
        throw error; // Already has a good message
      }

      // Unknown error - don't expose internal details to user
      throw new InternalServerError(
        'An unexpected error occurred while sending OTP. Please try again later.'
      );
    }
  }

  /**
   * Verify OTP and complete registration
   * POST /auth/register/verify
   */
  @Post('register/verify')
  @HttpCode(HttpStatus.CREATED)
  async registerWithOTP(
    @Body() registerDto: RegisterDto,
    @Body('otpCode') otpCode: string,
  ) {
    try {
      // Input validation
      if (!otpCode) {
        throw new BadRequestError('OTP code is required');
      }

      if (!registerDto.email || !registerDto.password) {
        throw new BadRequestError('Email and password are required');
      }

      // Verify OTP and register user
      const result = await this.authService.verifyAndRegister(
        registerDto,
        otpCode,
      );

      this.logger.log(`User registered successfully: ${registerDto.email}`);

      return {
        success: true,
        message: 'Registration completed successfully. Welcome!',
        user: result.user,
      };

    } catch (error) {
      this.logger.error(
        `Registration failed for ${registerDto?.email}`,
        error.stack,
        'registerWithOTP'
      );

      if (error instanceof UnauthorizedError) {
        throw new UnauthorizedError(
          'Invalid or expired OTP code. Please request a new code.'
        );
      }

      if (error instanceof NotFoundError) {
        throw new NotFoundError(
          'OTP code not found. Please request a new code.'
        );
      }

      if (error instanceof TooManyRequestsError) {
        throw new TooManyRequestsError(
          'Too many incorrect attempts. Please request a new OTP code.'
        );
      }

      if (error instanceof ConflictError) {
        throw new ConflictError(
          'This email address is already registered.'
        );
      }

      if (error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(
        'Registration failed due to an unexpected error. Please try again.'
      );
    }
  }

  /**
   * Resend OTP code
   * POST /auth/register/resend-otp
   */
  @Post('register/resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendRegistrationOTP(@Body('email') email: string) {
    try {
      if (!email) {
        throw new BadRequestError('Email address is required');
      }

      const result = await this.authService.resendRegistrationOTP(email);

      this.logger.log(`OTP resent successfully to ${email}`);

      return {
        success: true,
        message: 'A new OTP code has been sent to your email address.',
        expiresAt: result.expiresAt,
      };

    } catch (error) {
      this.logger.error(
        `Failed to resend OTP to ${email}`,
        error.stack,
        'resendRegistrationOTP'
      );

      if (error instanceof TooManyRequestsError) {
        throw new TooManyRequestsError(
          'You can only request a new OTP code once per minute. Please wait.'
        );
      }

      if (error instanceof ServiceUnavailableError) {
        throw new ServiceUnavailableError(
          'Email service is temporarily unavailable. Please try again later.'
        );
      }

      throw new InternalServerError(
        'Failed to resend OTP code. Please try again later.'
      );
    }
  }
}
```

---

## 3. Auth Service with Detailed Error Context

```typescript
// src/modules/auth/application/services/auth/auth.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { OtpService } from '../../../../shared/infrastructure/services/otp.service.js';
import { OtpPurpose, OtpChannel } from '../../../../shared/application/dto/otp.dto.js';
import {
  ConflictError,
  NotFoundError,
  InternalServerError,
  BadRequestError,
} from '../../../../shared/utils/error.utils.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel('User') private readonly userModel: Model<any>,
    private readonly otpService: OtpService,
  ) {}

  /**
   * Request OTP for user registration
   */
  async requestRegistrationOTP(email: string): Promise<{
    message: string;
    expiresAt: Date;
  }> {
    try {
      // Check if user already exists
      const existingUser = await this.userModel.findOne({
        email: email.toLowerCase()
      });

      if (existingUser) {
        throw new ConflictError(
          'An account with this email address already exists'
        );
      }

      // Send OTP via OtpService
      try {
        return await this.otpService.sendOTP({
          identifier: email,
          purpose: OtpPurpose.REGISTRATION,
          channel: OtpChannel.EMAIL,
          metadata: {
            action: 'user-registration',
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        // Add context that error came from OtpService
        this.logger.error(
          `OtpService.sendOTP failed for ${email}`,
          error.stack
        );
        throw error; // Re-throw to controller
      }

    } catch (error) {
      // If it's already our custom error, re-throw
      if (error instanceof ConflictError) {
        throw error;
      }

      // Add service context for unknown errors
      throw new InternalServerError(
        `AuthService.requestRegistrationOTP failed: ${error.message}`
      );
    }
  }

  /**
   * Verify OTP and complete user registration
   */
  async verifyAndRegister(
    registerDto: RegisterDto,
    otpCode: string,
  ): Promise<{ user: any }> {
    try {
      // Step 1: Verify OTP
      try {
        await this.otpService.verifyOTP({
          identifier: registerDto.email,
          code: otpCode,
          purpose: OtpPurpose.REGISTRATION,
        });
      } catch (error) {
        this.logger.error(
          `OTP verification failed in OtpService for ${registerDto.email}`,
          error.stack
        );
        throw error; // Let controller handle it
      }

      // Step 2: Hash password
      let hashedPassword: string;
      try {
        hashedPassword = await bcrypt.hash(registerDto.password, 10);
      } catch (error) {
        throw new InternalServerError(
          'Password encryption failed. Please try again.'
        );
      }

      // Step 3: Create user in database
      let newUser;
      try {
        newUser = await this.userModel.create({
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          email: registerDto.email.toLowerCase(),
          password: hashedPassword,
          role: registerDto.role || 'student',
          status: 'active',
          emailVerified: true, // Already verified via OTP
          createdAt: new Date(),
        });
      } catch (error) {
        this.logger.error(
          `Database user creation failed for ${registerDto.email}`,
          error.stack
        );

        // Check for duplicate key error (race condition)
        if (error.code === 11000) {
          throw new ConflictError(
            'This email was just registered by someone else'
          );
        }

        throw new InternalServerError(
          'Failed to create user account in database. Please try again.'
        );
      }

      // Step 4: Clean up OTP
      try {
        await this.otpService.deleteOTP(
          registerDto.email,
          OtpPurpose.REGISTRATION,
        );
      } catch (error) {
        // Log but don't fail - user is already created
        this.logger.warn(
          `OTP cleanup failed for ${registerDto.email}, but user was created`,
          error.stack
        );
      }

      return {
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new InternalServerError(
        `AuthService.verifyAndRegister failed: ${error.message}`
      );
    }
  }

  /**
   * Resend OTP for registration
   */
  async resendRegistrationOTP(email: string): Promise<{
    message: string;
    expiresAt: Date;
  }> {
    try {
      return await this.otpService.resendOTP({
        identifier: email,
        purpose: OtpPurpose.REGISTRATION,
        channel: OtpChannel.EMAIL,
      });
    } catch (error) {
      this.logger.error(
        `OtpService.resendOTP failed for ${email}`,
        error.stack
      );
      throw error;
    }
  }
}
```

---

## 4. Global Exception Filter (Recommended)

Create this to handle all errors consistently:

```typescript
// src/shared/filters/http-exception.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../utils/error.utils.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    // Handle our custom AppError
    if (exception instanceof AppError) {
      status = exception.statusCode;
      message = exception.message;
      error = exception.statusType === 'fail' ? 'Validation Failed' : 'Error';
    }
    // Handle NestJS HttpException
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
      } else {
        message = exceptionResponse as string;
      }
    }
    // Handle unknown errors
    else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack
      );
    }

    // Build error response
    const errorResponse = {
      success: false,
      statusCode: status,
      error: error,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log error details (for monitoring)
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        JSON.stringify(errorResponse),
        'AllExceptionsFilter',
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${message}`,
        'AllExceptionsFilter',
      );
    }

    response.status(status).json(errorResponse);
  }
}
```

Register it in `main.ts`:

```typescript
// src/main.ts
import { AllExceptionsFilter } from './shared/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(3000);
}
```

---

## 5. Example API Responses

### ✅ **Success Response:**
```json
{
  "success": true,
  "message": "OTP code has been successfully sent to your email address. The code will expire in 10 minutes.",
  "expiresAt": "2024-12-11T15:25:00.000Z"
}
```

### ❌ **Error Response (Rate Limit):**
```json
{
  "success": false,
  "statusCode": 429,
  "error": "Validation Failed",
  "message": "Too many OTP requests. Please wait a few minutes before trying again.",
  "timestamp": "2024-12-11T15:15:30.123Z",
  "path": "/auth/register/request-otp"
}
```

### ❌ **Error Response (Email Service Down):**
```json
{
  "success": false,
  "statusCode": 503,
  "error": "Error",
  "message": "Email service is temporarily unavailable. Please try again in a few minutes.",
  "timestamp": "2024-12-11T15:15:30.123Z",
  "path": "/auth/register/request-otp"
}
```

### ❌ **Error Response (Invalid Email):**
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Validation Failed",
  "message": "Invalid email address format",
  "timestamp": "2024-12-11T15:15:30.123Z",
  "path": "/auth/register/request-otp"
}
```

---

## Key Improvements:

1. ✅ **Clear Error Context:** Each error shows which service/function failed
2. ✅ **English Messages:** All user-facing messages in English
3. ✅ **Logging:** Detailed logs for debugging with Logger
4. ✅ **User-Friendly:** Non-technical error messages for users
5. ✅ **Specific Errors:** Different error types (BadRequest, ServiceUnavailable, etc.)
6. ✅ **Error Recovery:** Clean up OTP if email sending fails
7. ✅ **Validation:** Input validation before processing
8. ✅ **Consistent Format:** All responses follow same structure

This is production-ready error handling! 🚀
