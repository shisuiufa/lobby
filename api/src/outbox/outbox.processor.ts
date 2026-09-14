import { Injectable, Logger } from '@nestjs/common';
import { OutboxService } from '@/outbox/outbox.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RabbitMqPublisher } from '@/rabbitmq/rabbitmq.publisher';

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);

  constructor(
    private readonly outboxService: OutboxService,
    private readonly rabbitMqPublisher: RabbitMqPublisher,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS, {
    waitForCompletion: true,
  })
  async process(): Promise<void> {
    const events = await this.outboxService.claimPending();

    for (const event of events) {
      try {
        await this.rabbitMqPublisher.publish(
          event.exchangeName,
          event.routingKey,
          {
            pattern: event.routingKey,
            data: event.payload,
          },
          event.id,
        );

        await this.outboxService.markProcessed(event.id);
      } catch (error: unknown) {
        this.logger.error(`Failed to process outbox event ${event.id}`, error);
        await this.outboxService.handleFailed(event);
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    waitForCompletion: true,
  })
  async recoverStaleProcessing(): Promise<void> {
    await this.outboxService.recoverStaleProcessing();
  }
}
