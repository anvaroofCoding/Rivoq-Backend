import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { validate } from './config/env.validation.js';
import { getDatabaseConfig, getEmailConfig } from './config/env.config.js';

import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/users/user.module.js';
import { TeachersModule } from './modules/teachers/teachers.module.js';
import { StudentsModule } from './modules/students/students.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const database_config = getDatabaseConfig(configService);
        return {
          uri: database_config.uri,
        };
      },
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const emailConfig = getEmailConfig(configService);
        return {
          transport: {
            service: 'gmail',
            auth: {
              user: emailConfig.user,
              pass: emailConfig.password,
            },
          },
        };
      },
    }),
    AuthModule,
    UserModule,
    TeachersModule,
    StudentsModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
