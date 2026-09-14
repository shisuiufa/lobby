import { ConfigService } from '@nestjs/config';
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import type { MailTransport, SendMailInput } from '../mail.type';

@Injectable()
export class SmtpMailTransport implements MailTransport, OnApplicationShutdown {
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      pool: true,
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: this.config.getOrThrow<number>('SMTP_PORT'),
      secure: this.config.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });

    return this.transporter;
  }

  async send(input: SendMailInput): Promise<void> {
    await this.getTransporter().sendMail({
      from: this.config.getOrThrow<string>('SMTP_FROM'),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  }

  onApplicationShutdown(): void {
    this.transporter?.close();
  }
}
