import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  OutboxEvent,
  OutboxStatus,
  Prisma,
} from '@/prisma/generated/prisma/client';
import {
  OUTBOX_BATCH_SIZE,
  OUTBOX_RECOVERY_BATCH_SIZE,
} from './outbox.constant';
import { AppEvent } from '@/event/event.type';

@Injectable()
export class OutboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: AppEvent, tx?: Prisma.TransactionClient): Promise<OutboxEvent> {
    const db = tx ?? this.prisma;

    return db.outboxEvent.create({
      data: input,
    });
  }

  claimPending(): Promise<OutboxEvent[]> {
    return this.prisma.$queryRaw<OutboxEvent[]>`
      UPDATE outbox_events
      SET
        status = ${OutboxStatus.PROCESSING}::"OutboxStatus",
        updated_at = NOW()
      WHERE id IN (
        SELECT id
        FROM outbox_events
        WHERE status = ${OutboxStatus.PENDING}::"OutboxStatus"
          AND (
            next_attempt_at IS NULL
            OR next_attempt_at <= NOW()
          )
        ORDER BY created_at ASC
        LIMIT ${OUTBOX_BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING
        id,
        exchange_name AS "exchangeName",
        routing_key AS "routingKey",
        payload,
        status,
        retries,
        next_attempt_at AS "nextAttemptAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;
  }

  markProcessed(id: number): Promise<OutboxEvent> {
    return this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status: OutboxStatus.PROCESSED,
        nextAttemptAt: null,
      },
    });
  }

  scheduleRetry(id: number, nextAttemptAt: Date): Promise<OutboxEvent> {
    return this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status: OutboxStatus.PENDING,
        retries: {
          increment: 1,
        },
        nextAttemptAt,
      },
    });
  }

  markFailed(id: number): Promise<OutboxEvent> {
    return this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status: OutboxStatus.FAILED,
        nextAttemptAt: null,
      },
    });
  }

  findStaleProcessing(
    staleBefore: Date,
  ): Promise<Pick<OutboxEvent, 'id' | 'retries'>[]> {
    return this.prisma.outboxEvent.findMany({
      where: {
        status: OutboxStatus.PROCESSING,
        updatedAt: {
          lte: staleBefore,
        },
      },
      select: {
        id: true,
        retries: true,
      },
      orderBy: {
        updatedAt: 'asc',
      },
      take: OUTBOX_RECOVERY_BATCH_SIZE,
    });
  }

  async requeueStale(
    staleBefore: Date,
    ids: number[],
    nextAttemptAt: Date,
  ): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.prisma.outboxEvent.updateMany({
      where: {
        id: {
          in: ids,
        },
        status: OutboxStatus.PROCESSING,
        updatedAt: {
          lte: staleBefore,
        },
      },
      data: {
        status: OutboxStatus.PENDING,
        retries: {
          increment: 1,
        },
        nextAttemptAt,
      },
    });
  }

  async markStaleFailed(staleBefore: Date, ids: number[] = []): Promise<void> {
    await this.prisma.outboxEvent.updateMany({
      where: {
        id: {
          in: ids,
        },
        status: OutboxStatus.PROCESSING,
        updatedAt: {
          lte: staleBefore,
        },
      },
      data: {
        status: OutboxStatus.FAILED,
        nextAttemptAt: null,
      },
    });
  }
}
