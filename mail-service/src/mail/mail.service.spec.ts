import { ConfigService } from '@nestjs/config';
import { MailService } from '@/mail/mail.service';
import type { MailTransport, SendMailInput } from '@/mail/mail.type';

describe('MailService', () => {
  it('sends a verification email with the configured frontend URL', async () => {
    const sentMessages: SendMailInput[] = [];
    const transport: MailTransport = {
      send: (input) => {
        sentMessages.push(input);
      },
    };
    const config = {
      getOrThrow: (key: string) => {
        if (key === 'FRONTEND_URL') {
          return 'https://app.example.com';
        }

        throw new Error(`Unexpected config key: ${key}`);
      },
    };
    const service = new MailService(
      transport,
      config as unknown as ConfigService,
    );

    await service.sendVerificationEmail({
      email: 'user@example.com',
      token: 'token with spaces',
    });

    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0]).toMatchObject({
      to: 'user@example.com',
      subject: 'Verify your email',
    });
    expect(sentMessages[0].text).toContain(
      'https://app.example.com/verify-email?token=token+with+spaces',
    );
    expect(sentMessages[0].html).toContain(
      'https://app.example.com/verify-email?token=token+with+spaces',
    );
  });
});
