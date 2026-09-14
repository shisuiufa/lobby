import { Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { OutboxProcessor } from '@/outbox/outbox.processor';
import { RabbitMqModule } from '@/rabbitmq/rabbitmq.module';
import { OutboxRepository } from '@/outbox/outbox.repository';

@Module({
  imports: [RabbitMqModule],
  providers: [OutboxService, OutboxProcessor, OutboxRepository],
  exports: [OutboxService],
})
export class OutboxModule {}
