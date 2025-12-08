import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthController } from './presentation/auth/auth.controller.js';
import { AuthService } from './application/services/auth/auth.service.js';

import {
  User,
  UserSchema,
} from '../users/infrastructure/persistence/user.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
