import { OutboxEvent, OutboxStatus } from '@/prisma/generated/prisma/client';
import { ROUTING_KEY, EXCHANGE } from '@lobby/events';
import { OutboxRepository } from '@/outbox/outbox.repository';
import { OutboxService } from '@/outbox/outbox.service';
import {
  OUTBOX_MAX_RETRIES,
  OUTBOX_RETRY_DELAY_MS,
} from '@/outbox/outbox.constant';

const FIXED_DATE = new Date('2026-09-15T00:00:00.000Z');

type OutboxRepositoryMock = jest.Mocked<
  Pick<
    OutboxRepository,
    | 'scheduleRetry'
    | 'markFailed'
    | 'findStaleProcessing'
    | 'requeueStale'
    | 'markStaleFailed'
  >
>;

function createRepositoryMock(): OutboxRepositoryMock {
  return {
    scheduleRetry: jest.fn(),
    markFailed: jest.fn(),
    findStaleProcessing: jest.fn(),
    requeueStale: jest.fn(),
    markStaleFailed: jest.fn(),
  };
}

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

describe('OutboxService', () => {
  let service: OutboxService;
  let repository: OutboxRepositoryMock;

  beforeEach(() => {
    repository = createRepositoryMock();
    service = new OutboxService(repository as unknown as OutboxRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('schedules retry while retries count is below max retries', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_DATE);

    await service.handleFailed(
      createEvent({ id: 10, retries: OUTBOX_MAX_RETRIES - 1 }),
    );

    expect(repository.scheduleRetry).toHaveBeenCalledWith(
      10,
      new Date(FIXED_DATE.getTime() + OUTBOX_RETRY_DELAY_MS),
    );
    expect(repository.markFailed).not.toHaveBeenCalled();
  });

  it('marks the event failed when retries count reaches the max', async () => {
    await service.handleFailed(
      createEvent({ id: 10, retries: OUTBOX_MAX_RETRIES }),
    );

    expect(repository.markFailed).toHaveBeenCalledWith(10);
    expect(repository.scheduleRetry).not.toHaveBeenCalled();
  });

  it('requeues stale events below the retry limit and fails exhausted events', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_DATE);
    repository.findStaleProcessing.mockResolvedValue([
      { id: 10, retries: OUTBOX_MAX_RETRIES - 1 },
      { id: 11, retries: OUTBOX_MAX_RETRIES },
    ]);

    await service.recoverStaleProcessing();

    const staleBefore = new Date(FIXED_DATE.getTime() - 10 * 60_000);
    const nextAttemptAt = new Date(
      FIXED_DATE.getTime() + OUTBOX_RETRY_DELAY_MS,
    );
    expect(repository.findStaleProcessing).toHaveBeenCalledWith(staleBefore);
    expect(repository.requeueStale).toHaveBeenCalledWith(
      staleBefore,
      [10],
      nextAttemptAt,
    );
    expect(repository.markStaleFailed).toHaveBeenCalledWith(staleBefore, [11]);
  });
});
