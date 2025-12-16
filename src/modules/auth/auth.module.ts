import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './presentation/auth/auth.controller.js';
import { AuthService } from './application/services/auth/auth.service.js';
import { OtpService } from '../../shared/infrastructure/services/otp.service.js';
import { MailService } from '../../shared/infrastructure/services/email.service.js';
import { TokenService } from '../../shared/infrastructure/services/token.service.js';

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
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, MailService, TokenService],
  exports: [AuthService, OtpService],
})
export class AuthModule {}
