import { Module } from '@nestjs/common';
import { InboxModule } from '@/inbox/inbox.module';
import { MailController } from '@/mail/mail.controller';
import { RabbitmqReceiver } from './rabbitmq.receiver';

@Module({
  imports: [InboxModule],
  controllers: [MailController],
  providers: [RabbitmqReceiver],
})
export class RabbitMqModule {}
