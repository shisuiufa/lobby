import { Injectable, Logger } from '@nestjs/common';
import type { MailTransport, SendMailInput } from '../mail.type';

@Injectable()
export class ConsoleMailTransport implements MailTransport {
  private readonly logger = new Logger(ConsoleMailTransport.name);

  send(input: SendMailInput): void {
    this.logger.log(
      `To: ${input.to}\nSubject: ${input.subject}\n${input.text}`,
    );
  }
}
