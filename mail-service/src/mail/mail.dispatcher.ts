import { Injectable } from '@nestjs/common';
import { MailService } from '@/mail/mail.service';
import { InboxEvent } from '@/prisma/generated/prisma/client';
import {
  ROUTING_KEY,
  type EmailVerificationPayload,
  type RoutingKey,
} from '@lobby/events';

@Injectable()
export class MailDispatcher {
  constructor(private readonly mailService: MailService) {}

  async dispatch(event: InboxEvent): Promise<void> {
    const routingKey = event.routingKey as RoutingKey;

    switch (routingKey) {
      case ROUTING_KEY.EMAIL_VERIFICATION: {
        const payload = event.payload as EmailVerificationPayload;
        await this.mailService.sendVerificationEmail(payload);
        return;
      }
      default: {
        const _exhaustiveCheck: never = routingKey;
        throw new Error('Unsupported routing key');
      }
    }
  }
}
