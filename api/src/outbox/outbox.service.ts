import { Injectable } from '@nestjs/common';
import type { OutboxEvent, Prisma } from '@/prisma/generated/prisma/client';
import type { AppEvent } from '@/event/event.type';
import { OutboxRepository } from './outbox.repository';
import {
  OUTBOX_MAX_RETRIES,
  OUTBOX_RETRY_DELAY_MS,
} from '@/outbox/outbox.constant';

@Injectable()
export class OutboxService {
  constructor(private readonly outboxRepository: OutboxRepository) {}

  create(input: AppEvent, tx?: Prisma.TransactionClient): Promise<OutboxEvent> {
    return this.outboxRepository.create(input, tx);
  }

  claimPending(): Promise<OutboxEvent[]> {
    return this.outboxRepository.claimPending();
  }

  async markProcessed(id: number): Promise<void> {
    await this.outboxRepository.markProcessed(id);
  }

  async handleFailed(event: OutboxEvent): Promise<void> {
    if (event.retries >= OUTBOX_MAX_RETRIES) {
      await this.outboxRepository.markFailed(event.id);
      return;
    }

    await this.outboxRepository.scheduleRetry(
      event.id,
      new Date(Date.now() + OUTBOX_RETRY_DELAY_MS),
    );
  }
}
