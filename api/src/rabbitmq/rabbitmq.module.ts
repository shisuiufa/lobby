import { Module } from '@nestjs/common';
import { RabbitMqPublisher } from '@/rabbitmq/rabbitmq.publisher';

@Module({
  providers: [RabbitMqPublisher],
  exports: [RabbitMqPublisher],
})
export class RabbitMqModule {}
