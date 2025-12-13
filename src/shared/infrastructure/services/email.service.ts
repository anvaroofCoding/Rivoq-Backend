import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(to: string, subject: string, message: string) {
    await this.mailerService.sendMail({
      from: process.env.NODEMAILER_USER_EMAIL,
      to: to,
      subject: subject,
      html: message,
    });
  }
}
