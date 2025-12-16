import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class EnvironmentVariables {
  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 5000;

  @IsString()
  @IsNotEmpty()
  @Matches(/^mongodb(\+srv)?:\/\//, {
    message: 'MONGODB_ATLAS_URI must be a valid MongoDB connection string',
  })
  MONGODB_ATLAS_URI: string;

  @IsEmail({}, { message: 'NODEMAILER_USER_EMAIL must be a valid email' })
  @IsNotEmpty()
  NODEMAILER_USER_EMAIL: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message: 'NODEMAILER_USER_PASSWORD must be at least 8 characters',
  })
  NODEMAILER_USER_PASSWORD: string;

  @IsNumber()
  @Min(4, { message: 'OTP_LENGTH must be at least 4' })
  @Max(8, { message: 'OTP_LENGTH must be at most 8' })
  @IsOptional()
  OTP_LENGTH: number = 6;

  @IsNumber()
  @Min(1, { message: 'OTP_EXPIRY_MINUTES must be at least 1 minute' })
  @Max(60, { message: 'OTP_EXPIRY_MINUTES must be at most 60 minutes' })
  @IsOptional()
  OTP_EXPIRY_MINUTES: number = 10;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  MAX_ATTEMPTS: number = 5;

  @IsNumber()
  @Min(1)
  @IsOptional()
  RATE_LIMIT_MINUTES: number = 1;

  @IsNumber()
  @Min(8, { message: 'PASSWORD_BCRYPT_SALT_ROUNDS must be at least 8' })
  @Max(15, { message: 'PASSWORD_BCRYPT_SALT_ROUNDS must be at most 15' })
  @IsOptional()
  PASSWORD_BCRYPT_SALT_ROUNDS: number = 10;

  @IsString()
  @IsNotEmpty()
  @MinLength(32, {
    message:
      'JWT_ACCESS_TOKEN_SECRET_KEY must be at least 32 characters for security',
  })
  JWT_ACCESS_TOKEN_SECRET_KEY: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(s|m|h|d)$/, {
    message: 'JWT_ACCESS_TOKEN_EXPIRES_IN must be in format: 15m, 1h, 7d, etc.',
  })
  JWT_ACCESS_TOKEN_EXPIRES_IN: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(32, {
    message:
      'JWT_REFRESH_TOKEN_SECRET_KEY must be at least 32 characters for security',
  })
  JWT_REFRESH_TOKEN_SECRET_KEY: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(s|m|h|d)$/, {
    message:
      'JWT_REFRESH_TOKEN_EXPIRES_IN must be in format: 15m, 1h, 7d, etc.',
  })
  JWT_REFRESH_TOKEN_EXPIRES_IN: string;
}

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const message = errors
      .map((error) => {
        const constraints = error.constraints;
        return constraints ? Object.values(constraints).join(', ') : '';
      })
      .join('\n');

    throw new Error(`Config validation error:\n${message}`);
  }

  return validatedConfig;
}
