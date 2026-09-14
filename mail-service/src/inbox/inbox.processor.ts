import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InboxService } from './inbox.service';
import { MailDispatcher } from '@/mail/mail.dispatcher';

@Injectable()
export class InboxProcessor {
  private readonly logger = new Logger(InboxProcessor.name);

  constructor(
    private inboxService: InboxService,
    private readonly mailDispatcher: MailDispatcher,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS, {
    waitForCompletion: true,
  })
  async process(): Promise<void> {
    const events = await this.inboxService.claimReceived();

    for (const event of events) {
      try {
        await this.mailDispatcher.dispatch(event);
        await this.inboxService.markProcessed(event.id);
      } catch (error: unknown) {
        this.logger.error(
          `Failed to process inbox event ${event.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );

        await this.inboxService.handleFailed(event);
      }
    }
  }
}
