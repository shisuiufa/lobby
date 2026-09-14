import { Module } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { MailModule } from '@/mail/mail.module';
import { InboxProcessor } from './inbox.processor';
import { InboxRepository } from './inbox.repository';

@Module({
  imports: [MailModule],
  providers: [InboxService, InboxProcessor, InboxRepository],
  exports: [InboxService],
})
export class InboxModule {}
