import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RabbitMessage } from '@/rabbitmq/rabbitmq.type';
import {
  connect,
  type AmqpConnectionManager,
  type ChannelWrapper,
} from 'amqp-connection-manager';

@Injectable()
export class RabbitMqPublisher implements OnModuleInit, OnModuleDestroy {
  private connection: AmqpConnectionManager;
  private channel: ChannelWrapper;
  private readonly logger = new Logger(RabbitMqPublisher.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.getOrThrow<string>('RABBITMQ_URL');

    this.connection = connect([url], {
      heartbeatIntervalInSeconds: 5,
      reconnectTimeInSeconds: 5,
    });

    this.connection.on('connect', () => {
      this.logger.log('RabbitMQ connected');
    });

    this.connection.on('disconnect', ({ err }) => {
      this.logger.warn(`RabbitMQ disconnected: ${err.message}`);
    });

    this.connection.on('connectFailed', ({ err }) => {
      this.logger.error(`RabbitMQ connection failed: ${err.message}`);
    });

    this.channel = this.connection.createChannel({
      confirm: true,
      publishTimeout: 5_000,
    });
  }

  async onModuleDestroy() {
    await this.channel.close();
    await this.connection.close();
  }

  async publish(
    exchangeName: string,
    routingKey: string,
    data: RabbitMessage,
    messageId: number | string,
  ): Promise<void> {
    await this.channel.publish(
      exchangeName,
      routingKey,
      Buffer.from(JSON.stringify(data)),
      { persistent: true, messageId: String(messageId) },
    );
  }
}
