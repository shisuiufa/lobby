jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: {
    EVERY_5_SECONDS: '* * * * * *',
    EVERY_MINUTE: '* * * * *',
  },
}));

import { InboxService } from '@/inbox/inbox.service';
import { InboxProcessor } from '@/inbox/inbox.processor';
import { MailDispatcher } from '@/mail/mail.dispatcher';
import { InboxEvent, InboxStatus } from '@/prisma/generated/prisma/client';
import { ROUTING_KEY } from '@lobby/events';

const FIXED_DATE = new Date('2026-09-15T00:00:00.000Z');

function createInboxEvent(overrides: Partial<InboxEvent> = {}): InboxEvent {
  return {
    id: 1,
    idempotencyId: 'message-1',
    routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
    payload: {
      email: 'user@example.com',
      token: 'token',
    },
    retries: 0,
    nextAttemptAt: null,
    status: InboxStatus.PROCESSING,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  };
}

describe('InboxProcessor', () => {
  let processor: InboxProcessor;
  let inboxService: {
    claimReceived: jest.Mock;
    markProcessed: jest.Mock;
    handleFailed: jest.Mock;
  };
  let mailDispatcher: {
    dispatch: jest.Mock;
  };

  beforeEach(() => {
    inboxService = {
      claimReceived: jest.fn(),
      markProcessed: jest.fn(),
      handleFailed: jest.fn(),
    };

    mailDispatcher = {
      dispatch: jest.fn(),
    };

    processor = new InboxProcessor(
      inboxService as unknown as InboxService,
      mailDispatcher as unknown as MailDispatcher,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches received events and marks them as processed', async () => {
    const event = createInboxEvent({ id: 10 });

    inboxService.claimReceived.mockResolvedValue([event]);
    mailDispatcher.dispatch.mockResolvedValue(undefined);
    inboxService.markProcessed.mockResolvedValue(undefined);

    await processor.process();

    expect(mailDispatcher.dispatch).toHaveBeenCalledWith(event);
    expect(inboxService.markProcessed).toHaveBeenCalledWith(10);
    expect(inboxService.handleFailed).not.toHaveBeenCalled();
  });

  it('handles failed event processing', async () => {
    const event = createInboxEvent({ id: 10 });

    inboxService.claimReceived.mockResolvedValue([event]);
    mailDispatcher.dispatch.mockRejectedValue(new Error('SMTP failed'));
    inboxService.handleFailed.mockResolvedValue(undefined);

    await processor.process();

    expect(inboxService.handleFailed).toHaveBeenCalledWith(event);
    expect(inboxService.markProcessed).not.toHaveBeenCalled();
  });
});
