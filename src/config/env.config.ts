import { ConfigService } from '@nestjs/config';
import {
  DatabaseConfig,
  EmailConfig,
  JwtConfig,
  OtpConfig,
} from './env.interface.js';

export const getConfig = <T>(configService: ConfigService, key: string): T => {
  const value = configService.get<T>(key);
  if (value === undefined || value === null) {
    throw new Error(`Configuration key "${key}" is not defined`);
  }
  return value;
};

export const getJwtConfig = (configService: ConfigService): JwtConfig => ({
  accessSecret: getConfig<string>(configService, 'JWT_ACCESS_TOKEN_SECRET_KEY'),
  accessExpiry: getConfig<number>(configService, 'JWT_ACCESS_TOKEN_EXPIRES_IN'),
  refreshSecret: getConfig<string>(
    configService,
    'JWT_REFRESH_TOKEN_SECRET_KEY',
  ),
  refreshExpiry: getConfig<number>(
    configService,
    'JWT_REFRESH_TOKEN_EXPIRES_IN',
  ),
});

export const getDatabaseConfig = (
  configService: ConfigService,
): DatabaseConfig => ({
  uri: getConfig<string>(configService, 'MONGODB_ATLAS_URI'),
});

export const getEmailConfig = (configService: ConfigService): EmailConfig => ({
  user: getConfig<string>(configService, 'NODEMAILER_USER_EMAIL'),
  password: getConfig<string>(configService, 'NODEMAILER_USER_PASSWORD'),
});

export const getOtpConfig = (configService: ConfigService): OtpConfig => ({
  length: getConfig<number>(configService, 'OTP_LENGTH'),
  expiryMinutes: getConfig<number>(configService, 'OTP_EXPIRY_MINUTES'),
  maxAttempts: getConfig<number>(configService, 'MAX_ATTEMPTS'),
  rateLimitMinutes: getConfig<number>(configService, 'RATE_LIMIT_MINUTES'),
});

export const getBcryptSaltRounds = (configService: ConfigService): number => {
  return getConfig<number>(configService, 'PASSWORD_BCRYPT_SALT_ROUNDS');
};
