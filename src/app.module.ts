import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';

import { AuthModule } from './modules/auth/auth.module.js';
import { validate } from './config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    MongooseModule.forRoot(process.env.MONGODB_ATLAS_URI as string),
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.NODEMAILER_USER_EMAIL,
          pass: process.env.NODEMAILER_USER_PASSWORD,
        },
      },
    }),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
