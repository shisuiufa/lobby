import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MAIL_DRIVER, MAIL_TRANSPORT } from './mail.constant';
import { ConsoleMailTransport } from './transports/console-mail.transport';
import { SmtpMailTransport } from './transports/smtp-mail.transport';
import { MailDriver, MailTransport } from './mail.type';

export const MAIL_TRANSPORT_PROVIDER: Provider = {
  provide: MAIL_TRANSPORT,
  inject: [ConfigService, ConsoleMailTransport, SmtpMailTransport],
  useFactory: (
    config: ConfigService,
    consoleTransport: ConsoleMailTransport,
    smtpTransport: SmtpMailTransport,
  ): MailTransport => {
    const driver = config.getOrThrow<string>('MAIL_DRIVER') as MailDriver;

    switch (driver) {
      case MAIL_DRIVER.CONSOLE:
        return consoleTransport;

      case MAIL_DRIVER.SMTP:
        return smtpTransport;

      default: {
        const _exhaustiveCheck: never = driver;
        throw new Error('Unsupported mail driver');
      }
    }
  },
};
