import { ConfigService } from '@nestjs/config';
import {
  BcryptConfig,
  DatabaseConfig,
  DeviceConfig,
  EmailConfig,
  JwtConfig,
  OtpConfig,
  GoogleOAuthConfig,
  GitHubOAuthConfig,
} from './env.interface.js';

export const getConfig = <T>(configService: ConfigService, key: string): T => {
  const value = configService.get<T>(key);
  if (value === undefined || value === null) {
    throw new Error(`Configuration key "${key}" is not defined`);
  }
  return value;
};

const convertToSeconds = (timeString: string): number => {
  const regex = /^(\d+)(s|m|h|d)$/;
  const match = timeString.match(regex);

  if (!match) {
    throw new Error(
      `Invalid time format: ${timeString}. Expected format: 15m, 1h, 7d, etc.`,
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return value * multipliers[unit];
};

export const getJwtConfig = (configService: ConfigService): JwtConfig => ({
  accessSecret: getConfig<string>(configService, 'JWT_ACCESS_TOKEN_SECRET_KEY'),
  accessExpiry: convertToSeconds(
    getConfig<string>(configService, 'JWT_ACCESS_TOKEN_EXPIRES_IN'),
  ),
  refreshSecret: getConfig<string>(
    configService,
    'JWT_REFRESH_TOKEN_SECRET_KEY',
  ),
  refreshExpiry: convertToSeconds(
    getConfig<string>(configService, 'JWT_REFRESH_TOKEN_EXPIRES_IN'),
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

export const getBcryptSaltRounds = (
  configService: ConfigService,
): BcryptConfig => ({
  password_bcrypt_salt_rounds: getConfig<number>(
    configService,
    'PASSWORD_BCRYPT_SALT_ROUNDS',
  ),
});

export const getDeviceConfig = (
  configService: ConfigService,
): DeviceConfig => ({
  max_devices: getConfig<number>(configService, 'MAX_DEVICES'),
});

export const getGoogleOAuthConfig = (
  configService: ConfigService,
): GoogleOAuthConfig => ({
  clientID: getConfig<string>(configService, 'GOOGLE_CLIENT_ID'),
  clientSecret: getConfig<string>(configService, 'GOOGLE_CLIENT_SECRET'),
  callbackURL: getConfig<string>(configService, 'GOOGLE_CALLBACK_URL'),
});

export const getGitHubOAuthConfig = (
  configService: ConfigService,
): GitHubOAuthConfig => ({
  clientID: getConfig<string>(configService, 'GITHUB_CLIENT_ID'),
  clientSecret: getConfig<string>(configService, 'GITHUB_CLIENT_SECRET'),
  callbackURL: getConfig<string>(configService, 'GITHUB_CALLBACK_URL'),
});
