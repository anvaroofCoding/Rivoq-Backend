import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './presentation/auth/auth.controller.js';
import { AuthService } from './application/services/auth/auth.service.js';
import { OtpService } from '../../shared/infrastructure/services/otp.service.js';
import { MailService } from '../../shared/infrastructure/services/email.service.js';
import { TokenService } from '../../shared/infrastructure/services/token.service.js';

import { SessionModule } from '../session/session.module.js';
import { UserModule } from '../users/user.module.js';

import { GoogleStrategy } from './strategies/google.strategy.js';
import { GitHubStrategy } from './strategies/github.strategy.js';

import {
  User,
  UserSchema,
} from '../users/infrastructure/persistence/user.schema.js';
import {
  Otp,
  OtpSchema,
} from '../otp/infrastructure/persistence/otp.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Otp.name, schema: OtpSchema },
    ]),

    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    SessionModule,
    UserModule,
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    OtpService,
    MailService,
    TokenService,
    GoogleStrategy,
    GitHubStrategy,
  ],

  exports: [AuthService, OtpService],
})
export class AuthModule {}
