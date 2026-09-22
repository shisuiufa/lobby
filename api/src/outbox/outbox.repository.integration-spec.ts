import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EXCHANGE, ROUTING_KEY } from '@lobby/events';
import { OutboxRepository } from '@/outbox/outbox.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { OutboxStatus } from '@/prisma/generated/prisma/enums';
import { PostgresTestDatabase } from 'test/support/postgres-test-database';
import { cleanupApiDatabase } from 'test/support/cleanup-api-database';

describe('OutboxRepository (integration)', () => {
  let database: PostgresTestDatabase;
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let repository: OutboxRepository;
  let databaseUrl: string;

  function createConfigService(): Pick<ConfigService, 'getOrThrow'> {
    return {
      getOrThrow: (key: string): string => {
        if (key === 'DATABASE_URL') return databaseUrl;
        throw new Error(`Missing test config: ${key}`);
      },
    };
  }

  async function createCompetingRepository(): Promise<{
    prisma: PrismaService;
    repository: OutboxRepository;
  }> {
    const competingPrisma = new PrismaService(
      createConfigService() as ConfigService,
    );
    await competingPrisma.$connect();
    return {
      prisma: competingPrisma,
      repository: new OutboxRepository(competingPrisma),
    };
  }

  beforeAll(async () => {
    database = new PostgresTestDatabase();
    databaseUrl = await database.start();
    moduleRef = await Test.createTestingModule({
      providers: [
        OutboxRepository,
        PrismaService,
        { provide: ConfigService, useValue: createConfigService() },
      ],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    repository = moduleRef.get(OutboxRepository);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await moduleRef.close();
    await database.stop();
  });

  beforeEach(() => cleanupApiDatabase(prisma));

  it('creates an event with pending status and zero retries', async () => {
    const event = await repository.create({
      exchangeName: EXCHANGE.AUTH,
      routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
      payload: { email: 'user@example.com', token: 'token' },
    });

    expect(event).toMatchObject({
      exchangeName: EXCHANGE.AUTH,
      routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
      status: OutboxStatus.PENDING,
      retries: 0,
      nextAttemptAt: null,
    });
  });

  it('claims only ready pending events and skips a locked row', async () => {
    const competing = await createCompetingRepository();
    try {
      const lockedEvent = await prisma.outboxEvent.create({
        data: {
          exchangeName: EXCHANGE.AUTH,
          routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
          payload: {},
          createdAt: new Date('2026-09-15T00:00:00Z'),
        },
      });
      const availableEvent = await prisma.outboxEvent.create({
        data: {
          exchangeName: EXCHANGE.AUTH,
          routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
          payload: {},
          createdAt: new Date('2026-09-15T00:00:01Z'),
        },
      });

      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "outbox_events" WHERE id = ${lockedEvent.id} FOR UPDATE`;
        const claimed = await competing.repository.claimPending();
        expect(claimed).toHaveLength(1);
        expect(claimed[0].id).toBe(availableEvent.id);
        expect(claimed[0].status).toBe(OutboxStatus.PROCESSING);
      });
    } finally {
      await competing.prisma.$disconnect();
    }
  });

  it('marks an event processed and clears its retry time', async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        exchangeName: EXCHANGE.AUTH,
        routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
        payload: {},
        status: OutboxStatus.PROCESSING,
        retries: 2,
        nextAttemptAt: new Date('2026-09-15T00:00:00Z'),
      },
    });
    await repository.markProcessed(event.id);
    await expect(
      prisma.outboxEvent.findUniqueOrThrow({ where: { id: event.id } }),
    ).resolves.toMatchObject({
      status: OutboxStatus.PROCESSED,
      retries: 2,
      nextAttemptAt: null,
    });
  });

  it('increments retries when scheduling an event', async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        exchangeName: EXCHANGE.AUTH,
        routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
        payload: {},
      },
    });
    const nextAttemptAt = new Date('2026-09-15T00:01:00Z');
    await repository.scheduleRetry(event.id, nextAttemptAt);
    await expect(
      prisma.outboxEvent.findUniqueOrThrow({ where: { id: event.id } }),
    ).resolves.toMatchObject({
      status: OutboxStatus.PENDING,
      retries: 1,
      nextAttemptAt,
    });
  });

  it('fails only stale processing events that still match the guard', async () => {
    const staleBefore = new Date('2026-09-15T00:10:00Z');
    const stale = await prisma.outboxEvent.create({
      data: {
        exchangeName: EXCHANGE.AUTH,
        routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
        payload: {},
        status: OutboxStatus.PROCESSING,
        updatedAt: new Date('2026-09-15T00:01:00Z'),
      },
    });
    const recent = await prisma.outboxEvent.create({
      data: {
        exchangeName: EXCHANGE.AUTH,
        routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
        payload: {},
        status: OutboxStatus.PROCESSING,
        updatedAt: new Date('2026-09-15T00:11:00Z'),
      },
    });

    await repository.markStaleFailed(staleBefore, [stale.id, recent.id]);

    await expect(
      prisma.outboxEvent.findUniqueOrThrow({ where: { id: stale.id } }),
    ).resolves.toMatchObject({
      status: OutboxStatus.FAILED,
      nextAttemptAt: null,
    });
    await expect(
      prisma.outboxEvent.findUniqueOrThrow({ where: { id: recent.id } }),
    ).resolves.toMatchObject({ status: OutboxStatus.PROCESSING });
  });
});
