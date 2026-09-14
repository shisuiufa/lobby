import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { InboxEvent, InboxStatus } from '@/prisma/generated/prisma/client';
import { InboxEventInput } from './inbox.type';
import { INBOX_BATCH_SIZE } from './inbox.constant';

@Injectable()
export class InboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createIfNotExists(input: InboxEventInput): Promise<void> {
    await this.prisma.inboxEvent.createMany({
      data: [input],
      skipDuplicates: true,
    });
  }

  claimReceived(): Promise<InboxEvent[]> {
    return this.prisma.$queryRaw<InboxEvent[]>`
      UPDATE inbox_events
      SET
        status = ${InboxStatus.PROCESSING}::"InboxStatus",
        updated_at = NOW()
      WHERE id IN (
        SELECT id
        FROM inbox_events
        WHERE status = ${InboxStatus.RECEIVED}::"InboxStatus"
          AND (
            next_attempt_at IS NULL
            OR next_attempt_at <= NOW()
          )
        ORDER BY created_at ASC
        LIMIT ${INBOX_BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING
        id,
        idempotency_id AS "idempotencyId",
        routing_key AS "routingKey",
        payload,
        retries,
        next_attempt_at AS "nextAttemptAt",
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;
  }

  markProcessed(id: number): Promise<InboxEvent> {
    return this.prisma.inboxEvent.update({
      where: {
        id,
      },
      data: {
        status: InboxStatus.PROCESSED,
        nextAttemptAt: null,
      },
    });
  }

  scheduleRetry(id: number, nextAttemptAt: Date): Promise<InboxEvent> {
    return this.prisma.inboxEvent.update({
      where: {
        id,
      },
      data: {
        status: InboxStatus.RECEIVED,
        retries: {
          increment: 1,
        },
        nextAttemptAt,
      },
    });
  }

  markFailed(id: number): Promise<InboxEvent> {
    return this.prisma.inboxEvent.update({
      where: {
        id,
      },
      data: {
        status: InboxStatus.FAILED,
        nextAttemptAt: null,
      },
    });
  }
}
