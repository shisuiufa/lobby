import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MAIL_TRANSPORT, VERIFY_EMAIL_ENDPOINT } from './mail.constant';
import type { MailTransport } from './mail.type';
import { verifyEmailTemplate } from './templates/verify-email.template';
import type { EmailVerificationPayload } from '@lobby/events';

@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_TRANSPORT)
    private readonly transport: MailTransport,
    private readonly config: ConfigService,
  ) {}

  async sendVerificationEmail(
    payload: EmailVerificationPayload,
  ): Promise<void> {
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');

    const verificationUrl = new URL(VERIFY_EMAIL_ENDPOINT, frontendUrl);

    verificationUrl.searchParams.set('token', payload.token);

    const template = verifyEmailTemplate({
      verificationUrl: verificationUrl.toString(),
    });

    await this.transport.send({
      to: payload.email,
      ...template,
    });
  }
}
