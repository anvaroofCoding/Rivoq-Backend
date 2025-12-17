import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getEmailConfig } from '../../../config/env.config.js';

@Injectable()
export class MailService {
  private readonly getEmailConfig: ReturnType<typeof getEmailConfig>;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.getEmailConfig = getEmailConfig(this.configService);
  }

  async sendMail(to: string, subject: string, message: string) {
    await this.mailerService.sendMail({
      from: this.getEmailConfig.user,
      to: to,
      subject: subject,
      html: message,
    });
  }
}
