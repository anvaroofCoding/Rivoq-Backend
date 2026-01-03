import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './infrastructure/persistence/user.schema.js';
import {
  UserProfile,
  UserProfileSchema,
} from './infrastructure/persistence/user-profile.schema.js';
import { UserController } from './presentation/user.controller.js';
import { UserService } from './application/services/user.service.js';
import { UserProfileService } from './application/services/user-profile.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
    ]),
  ],

  controllers: [UserController],
  providers: [UserService, UserProfileService],
  exports: [UserService, UserProfileService],
})
export class UserModule {}
