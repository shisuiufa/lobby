import { Injectable } from '@nestjs/common';
import type { InboxEvent } from '@/prisma/generated/prisma/client';
import { InboxRepository } from './inbox.repository';
import { INBOX_MAX_RETRIES, INBOX_RETRY_DELAY_MS } from './inbox.constant';
import type { InboxEventInput } from './inbox.type';

@Injectable()
export class InboxService {
  constructor(private readonly inboxRepository: InboxRepository) {}

  createIfNotExists(input: InboxEventInput): Promise<void> {
    return this.inboxRepository.createIfNotExists(input);
  }

  claimReceived(): Promise<InboxEvent[]> {
    return this.inboxRepository.claimReceived();
  }

  async markProcessed(id: number): Promise<void> {
    await this.inboxRepository.markProcessed(id);
  }

  async handleFailed(event: InboxEvent): Promise<void> {
    if (event.retries >= INBOX_MAX_RETRIES) {
      await this.inboxRepository.markFailed(event.id);
      return;
    }

    await this.inboxRepository.scheduleRetry(
      event.id,
      new Date(Date.now() + INBOX_RETRY_DELAY_MS),
    );
  }
}
