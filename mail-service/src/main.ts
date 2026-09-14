import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { connect } from 'amqplib';
import { EXCHANGE, ROUTING_KEY } from '@lobby/events';

const MAIL_QUEUE = 'mail_queue';
const MAIL_DLQ = 'mail_dlq';

const MAIL_QUEUE_ARGUMENTS = {
  'x-queue-type': 'quorum',
  'x-delayed-retry-type': 'failed',
  'x-delayed-retry-min': 30_000,
  'x-delayed-retry-max': 300_000,
  'x-delivery-limit': 5,
  'x-dead-letter-exchange': '',
  'x-dead-letter-routing-key': MAIL_DLQ,
};

async function ensureTopology(url: string): Promise<void> {
  const connection = await connect(url);
  const channel = await connection.createChannel();

  try {
    await channel.assertExchange(EXCHANGE.AUTH, 'topic', {
      durable: true,
    });

    await channel.assertQueue(MAIL_DLQ, {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
      },
    });

    await channel.assertQueue(MAIL_QUEUE, {
      durable: true,
      arguments: MAIL_QUEUE_ARGUMENTS,
    });

    await channel.bindQueue(
      MAIL_QUEUE,
      EXCHANGE.AUTH,
      ROUTING_KEY.EMAIL_VERIFICATION,
    );
  } finally {
    await channel.close();
    await connection.close();
  }
}

async function bootstrap(): Promise<void> {
  const RABBIT_MQ_URL = process.env.RABBITMQ_URL;

  if (!RABBIT_MQ_URL) {
    throw new Error('RABBITMQ_URL is not defined in environment variables');
  }

  await ensureTopology(RABBIT_MQ_URL);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [RABBIT_MQ_URL],
        queue: MAIL_QUEUE,
        noAck: false,
        noAssert: true,
      },
    },
  );

  process.on('SIGTERM', () => {
    void app.close().then(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    void app.close().then(() => process.exit(0));
  });

  await app.listen();
}

void bootstrap();
