export interface EnvironmentVariables {
  // Server PORT
  PORT: number;

  // Database
  MONGODB_ATLAS_URI: string;

  // Email
  NODEMAILER_USER_EMAIL: string;
  NODEMAILER_USER_PASSWORD: string;

  // OTP
  OTP_LENGTH: number;
  OTP_EXPIRY_MINUTES: number;
  MAX_ATTEMPTS: number;
  RATE_LIMIT_MINUTES: number;

  // PASSWORD Config (Bcrypt)
  PASSWORD_BCRYPT_SALT_ROUNDS: number;

  // JWT
  // Access Token Config
  JWT_ACCESS_TOKEN_SECRET_KEY: string;
  JWT_ACCESS_TOKEN_EXPIRES_IN: string;

  // Refresh Token Config
  JWT_REFRESH_TOKEN_SECRET_KEY: string;
  JWT_REFRESH_TOKEN_EXPIRES_IN: string;

  // Device Config
  MAX_DEVICES: number;
}

// JWT Config
export interface JwtConfig {
  accessSecret: string;
  accessExpiry: number;
  refreshSecret: string;
  refreshExpiry: number;
}

// Database config
export interface DatabaseConfig {
  uri: string;
}

// Email config
export interface EmailConfig {
  user: string;
  password: string;
}

// OTP config
export interface OtpConfig {
  length: number;
  expiryMinutes: number;
  maxAttempts: number;
  rateLimitMinutes: number;
}

// Bcrypt config
export interface BcryptConfig {
  password_bcrypt_salt_rounds: number;
}

// Device config
export interface DeviceConfig {
  max_devices: number;
}
