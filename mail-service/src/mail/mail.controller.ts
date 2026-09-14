import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { type EmailVerificationPayload, ROUTING_KEY } from '@lobby/events';
import { RabbitmqReceiver } from '@/rabbitmq/rabbitmq.receiver';

@Controller()
export class MailController {
  constructor(private readonly inboxReceiver: RabbitmqReceiver) {}

  @EventPattern(ROUTING_KEY.EMAIL_VERIFICATION)
  async handleEmailVerification(
    @Payload() payload: EmailVerificationPayload,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.inboxReceiver.receive(
      ROUTING_KEY.EMAIL_VERIFICATION,
      payload,
      context,
    );
  }
}
