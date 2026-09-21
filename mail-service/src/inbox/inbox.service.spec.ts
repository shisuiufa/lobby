import { InboxRepository } from '@/inbox/inbox.repository';
import { InboxEvent, InboxStatus } from '@/prisma/generated/prisma/client';
import { ROUTING_KEY } from '@lobby/events';
import { InboxService } from '@/inbox/inbox.service';
import {
  INBOX_MAX_RETRIES,
  INBOX_RETRY_DELAY_MS,
} from '@/inbox/inbox.constant';

type InboxRepositoryMock = jest.Mocked<
  Pick<InboxRepository, 'scheduleRetry' | 'markFailed'>
>;

const FIXED_DATE = new Date('2026-09-15T00:00:00.000Z');

function createInboxRepositoryMock(): InboxRepositoryMock {
  return {
    scheduleRetry: jest.fn(),
    markFailed: jest.fn(),
  };
}

function createInboxEvent(overrides: Partial<InboxEvent> = {}): InboxEvent {
  return {
    id: 1,
    idempotencyId: 'message',
    routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
    payload: {
      email: 'user@example.com',
      token: 'token',
    },
    retries: 0,
    nextAttemptAt: null,
    status: InboxStatus.RECEIVED,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  };
}

describe('InboxService', () => {
  let service: InboxService;
  let repository: InboxRepositoryMock;

  beforeEach(() => {
    repository = createInboxRepositoryMock();
    service = new InboxService(repository as unknown as InboxRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('schedules retry when retries count is below max retries', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_DATE);

    const event = createInboxEvent({
      id: 10,
      retries: INBOX_MAX_RETRIES - 1,
    });

    await service.handleFailed(event);

    const expectedNextAttemptAt = new Date(
      FIXED_DATE.getTime() + INBOX_RETRY_DELAY_MS,
    );

    expect(repository.scheduleRetry).toHaveBeenCalledWith(
      10,
      expectedNextAttemptAt,
    );
    expect(repository.markFailed).not.toHaveBeenCalled();
  });

  it('marks event as failed when retries count reached max retries', async () => {
    const event = createInboxEvent({
      id: 10,
      retries: INBOX_MAX_RETRIES,
    });

    await service.handleFailed(event);

    expect(repository.markFailed).toHaveBeenCalledWith(10);
    expect(repository.scheduleRetry).not.toHaveBeenCalled();
  });
});
