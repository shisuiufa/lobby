import { PrismaService } from '@/prisma/prisma.service';
import { InboxRepository } from '@/inbox/inbox.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgresTestDatabase } from 'test/support/postgres-test-database';
import { ConfigService } from '@nestjs/config';
import { cleanupMailDatabase } from 'test/support/cleanup-mail-database';
import { ROUTING_KEY } from '@lobby/events';
import { InboxStatus } from '@/prisma/generated/prisma/enums';

describe('InboxRepository (integration)', () => {
  let database: PostgresTestDatabase;
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let repository: InboxRepository;
  let configService: Pick<ConfigService, 'getOrThrow'>;

  function createConfigService(
    databaseUrl: string,
  ): Pick<ConfigService, 'getOrThrow'> {
    return {
      getOrThrow: (key: string): string => {
        if (key === 'DATABASE_URL') {
          return databaseUrl;
        }

        throw new Error(`Missing test config: ${key}`);
      },
    };
  }

  async function createCompetingRepository(): Promise<{
    prisma: PrismaService;
    repository: InboxRepository;
  }> {
    const competingPrisma = new PrismaService(configService as ConfigService);
    await competingPrisma.$connect();

    return {
      prisma: competingPrisma,
      repository: new InboxRepository(competingPrisma),
    };
  }

  beforeAll(async () => {
    database = new PostgresTestDatabase();

    const databaseUrl = await database.start();

    configService = createConfigService(databaseUrl);

    moduleRef = await Test.createTestingModule({
      providers: [
        InboxRepository,
        PrismaService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    repository = moduleRef.get(InboxRepository);

    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await moduleRef.close();
    await database.stop();
  });

  beforeEach(async () => {
    await cleanupMailDatabase(prisma);
  });

  it('creates inbox event only once by idempotency id', async () => {
    const input = {
      idempotencyId: 'message-1',
      routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
      payload: {
        email: 'user@example.com',
        token: 'token',
      },
    };

    await repository.createIfNotExists(input);
    await repository.createIfNotExists(input);

    const events = await prisma.inboxEvent.findMany();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      idempotencyId: 'message-1',
      routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
      status: InboxStatus.RECEIVED,
      retries: 0,
      nextAttemptAt: null,
    });
  });

  it('skips locked received events when claiming events concurrently', async () => {
    const competing = await createCompetingRepository();

    try {
      const lockedEvent = await prisma.inboxEvent.create({
        data: {
          idempotencyId: 'message-1',
          routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
          payload: {
            email: 'first@example.com',
            token: 'token-1',
          },
          createdAt: new Date('2026-09-15T00:00:00.000Z'),
        },
      });

      const availableEvent = await prisma.inboxEvent.create({
        data: {
          idempotencyId: 'message-2',
          routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
          payload: {
            email: 'second@example.com',
            token: 'token-2',
          },
          createdAt: new Date('2026-09-15T00:00:01.000Z'),
        },
      });

      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`
        SELECT id
        FROM "inbox_events"
        WHERE id = ${lockedEvent.id}
        FOR UPDATE
      `;

        const claimedEvents = await competing.repository.claimReceived();

        expect(claimedEvents).toHaveLength(1);
        expect(claimedEvents[0].id).toBe(availableEvent.id);
        expect(claimedEvents[0].status).toBe(InboxStatus.PROCESSING);
      });

      const lockedEventAfterClaim = await prisma.inboxEvent.findUniqueOrThrow({
        where: {
          id: lockedEvent.id,
        },
      });

      const availableEventAfterClaim =
        await prisma.inboxEvent.findUniqueOrThrow({
          where: {
            id: availableEvent.id,
          },
        });

      expect(lockedEventAfterClaim.status).toBe(InboxStatus.RECEIVED);
      expect(availableEventAfterClaim.status).toBe(InboxStatus.PROCESSING);
    } finally {
      await competing.prisma.$disconnect();
    }
  });

  it('marks an inbox event as processed and clears retry time', async () => {
    const event = await prisma.inboxEvent.create({
      data: {
        idempotencyId: 'message-1',
        routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
        payload: {
          email: 'user@example.com',
          token: 'token',
        },
        status: InboxStatus.PROCESSING,
        retries: 2,
        nextAttemptAt: new Date('2026-09-15T00:00:00.000Z'),
      },
    });

    await repository.markProcessed(event.id);

    const processedEvent = await prisma.inboxEvent.findUniqueOrThrow({
      where: { id: event.id },
    });

    expect(processedEvent).toMatchObject({
      id: event.id,
      status: InboxStatus.PROCESSED,
      retries: 2,
      nextAttemptAt: null,
    });
  });

  it('schedules an inbox event for retry', async () => {
    const nextAttemptAt = new Date('2026-09-15T00:00:00.000Z');

    const event = await prisma.inboxEvent.create({
      data: {
        idempotencyId: 'message-1',
        routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
        payload: {
          email: 'user@example.com',
          token: 'token',
        },
        status: InboxStatus.RECEIVED,
        retries: 0,
        nextAttemptAt: null,
      },
    });

    await repository.scheduleRetry(event.id, nextAttemptAt);

    const retryEvent = await prisma.inboxEvent.findUniqueOrThrow({
      where: { id: event.id },
    });

    expect(retryEvent).toMatchObject({
      id: event.id,
      status: InboxStatus.RECEIVED,
      retries: 1,
      nextAttemptAt,
    });
  });

  it('marks an inbox event as failed and clears retry time', async () => {
    const nextAttemptAt = new Date('2026-09-15T00:00:00.000Z');

    const event = await prisma.inboxEvent.create({
      data: {
        idempotencyId: 'message-1',
        routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
        payload: {
          email: 'user@example.com',
          token: 'token',
        },
        status: InboxStatus.PROCESSING,
        nextAttemptAt: nextAttemptAt,
      },
    });

    await repository.markFailed(event.id);

    const failedEvent = await prisma.inboxEvent.findUniqueOrThrow({
      where: { id: event.id },
    });

    expect(failedEvent).toMatchObject({
      id: event.id,
      status: InboxStatus.FAILED,
      nextAttemptAt: null,
    });
  });

  it('finds stale processing event ids in update order', async () => {
    const staleBefore = new Date('2026-09-15T00:10:00.000Z');

    const oldest = await prisma.inboxEvent.create({
      data: {
        idempotencyId: 'message-1',
        routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
        payload: {},
        status: InboxStatus.PROCESSING,
        updatedAt: new Date('2026-09-15T00:01:00.000Z'),
      },
    });

    const newestStale = await prisma.inboxEvent.create({
      data: {
        idempotencyId: 'message-2',
        routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
        payload: {},
        status: InboxStatus.PROCESSING,
        updatedAt: new Date('2026-09-15T00:09:00.000Z'),
      },
    });

    await prisma.inboxEvent.create({
      data: {
        idempotencyId: 'message-3',
        routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
        payload: {},
        status: InboxStatus.PROCESSING,
        updatedAt: new Date('2026-09-15T00:11:00.000Z'),
      },
    });

    const staleIds = await repository.findStaleProcessingIds(staleBefore);

    expect(staleIds).toEqual([{ id: oldest.id }, { id: newestStale.id }]);
  });

  it('marks only matching stale processing events as failed', async () => {
    const staleBefore = new Date('2026-09-15T00:10:00.000Z');

    const staleEvent = await prisma.inboxEvent.create({
      data: {
        idempotencyId: 'message-1',
        routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
        payload: {},
        status: InboxStatus.PROCESSING,
        nextAttemptAt: new Date('2026-09-15T00:05:00.000Z'),
        updatedAt: new Date('2026-09-15T00:01:00.000Z'),
      },
    });

    const recentEvent = await prisma.inboxEvent.create({
      data: {
        idempotencyId: 'message-2',
        routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
        payload: {},
        status: InboxStatus.PROCESSING,
        updatedAt: new Date('2026-09-15T00:11:00.000Z'),
      },
    });

    await repository.markStaleFailed(staleBefore, [
      staleEvent.id,
      recentEvent.id,
    ]);

    const updatedStaleEvent = await prisma.inboxEvent.findUniqueOrThrow({
      where: { id: staleEvent.id },
    });

    const unchangedRecentEvent = await prisma.inboxEvent.findUniqueOrThrow({
      where: { id: recentEvent.id },
    });

    expect(updatedStaleEvent).toMatchObject({
      status: InboxStatus.FAILED,
      nextAttemptAt: null,
    });

    expect(unchangedRecentEvent).toMatchObject({
      status: InboxStatus.PROCESSING,
    });
  });
});
