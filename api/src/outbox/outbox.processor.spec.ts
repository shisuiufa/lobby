jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: {
    EVERY_5_SECONDS: '* * * * * *',
    EVERY_MINUTE: '* * * * *',
  },
}));

import { OutboxProcessor } from '@/outbox/outbox.processor';
import { OutboxService } from '@/outbox/outbox.service';
import { RabbitMqPublisher } from '@/rabbitmq/rabbitmq.publisher';
import { OutboxEvent, OutboxStatus } from '@/prisma/generated/prisma/client';
import { EXCHANGE, ROUTING_KEY } from '@lobby/events';

const FIXED_DATE = new Date('2026-09-15T00:00:00.000Z');

function createEvent(overrides: Partial<OutboxEvent> = {}): OutboxEvent {
  return {
    id: 1,
    exchangeName: EXCHANGE.AUTH,
    routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
    payload: { email: 'user@example.com', token: 'token' },
    status: OutboxStatus.PROCESSING,
    retries: 0,
    nextAttemptAt: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  };
}

describe('OutboxProcessor', () => {
  let processor: OutboxProcessor;
  let outboxService: {
    claimPending: jest.Mock;
    markProcessed: jest.Mock;
    handleFailed: jest.Mock;
    recoverStaleProcessing: jest.Mock;
  };
  let publisher: { publish: jest.Mock };

  beforeEach(() => {
    outboxService = {
      claimPending: jest.fn(),
      markProcessed: jest.fn(),
      handleFailed: jest.fn(),
      recoverStaleProcessing: jest.fn(),
    };
    publisher = { publish: jest.fn() };
    processor = new OutboxProcessor(
      outboxService as unknown as OutboxService,
      publisher as unknown as RabbitMqPublisher,
    );
  });

  it('publishes pending events and marks them processed', async () => {
    const event = createEvent({ id: 10 });
    outboxService.claimPending.mockResolvedValue([event]);

    await processor.process();

    expect(publisher.publish).toHaveBeenCalledWith(
      event.exchangeName,
      event.routingKey,
      { pattern: event.routingKey, data: event.payload },
      event.id,
    );
    expect(outboxService.markProcessed).toHaveBeenCalledWith(10);
    expect(outboxService.handleFailed).not.toHaveBeenCalled();
  });

  it('handles publisher failures with the original event', async () => {
    const event = createEvent({ id: 10 });
    outboxService.claimPending.mockResolvedValue([event]);
    publisher.publish.mockRejectedValue(new Error('RabbitMQ unavailable'));

    await processor.process();

    expect(outboxService.handleFailed).toHaveBeenCalledWith(event);
    expect(outboxService.markProcessed).not.toHaveBeenCalled();
  });

  it('delegates stale processing recovery to the service', async () => {
    await processor.recoverStaleProcessing();

    expect(outboxService.recoverStaleProcessing).toHaveBeenCalledTimes(1);
  });
});
