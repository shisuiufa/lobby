import { Module } from '@nestjs/common';
import { MailDispatcher } from './mail.dispatcher';
import { MAIL_TRANSPORT_PROVIDER } from './mail.provider';
import { SmtpMailTransport } from './transports/smtp-mail.transport';
import { ConsoleMailTransport } from './transports/console-mail.transport';
import { MailService } from './mail.service';

@Module({
  providers: [
    MailService,
    MailDispatcher,
    ConsoleMailTransport,
    SmtpMailTransport,
    MAIL_TRANSPORT_PROVIDER,
  ],
  exports: [MailDispatcher],
})
export class MailModule {}
