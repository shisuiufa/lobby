import { Injectable, Logger } from '@nestjs/common';
import { InboxService } from '@/inbox/inbox.service';
import { RmqContext } from '@nestjs/microservices';
import type { Channel, ConsumeMessage } from 'amqplib';
import type { RoutingKey } from '@lobby/events';

@Injectable()
export class RabbitmqReceiver {
  private readonly logger = new Logger(RabbitmqReceiver.name);

  constructor(private readonly inboxService: InboxService) {}

  async receive(
    routingKey: RoutingKey,
    payload: object,
    context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as Channel;
    const message = context.getMessage() as ConsumeMessage;
    const messageId: unknown = message.properties.messageId;

    if (typeof messageId !== 'string' || !messageId) {
      this.logger.error('RabbitMQ messageId is missing');
      channel.reject(message, false);
      return;
    }

    try {
      await this.inboxService.createIfNotExists({
        idempotencyId: messageId,
        routingKey,
        payload,
      });

      channel.ack(message);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to save inbox event: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      channel.reject(message, true);
    }
  }
}
