import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';

import { AuthModule } from './modules/auth/auth.module.js';
import { validate } from './config/env.validation.js';
import { getDatabaseConfig, getEmailConfig } from './config/env.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
