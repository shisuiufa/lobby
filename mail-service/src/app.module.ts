import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { MailModule } from '@/mail/mail.module';
import { InboxModule } from '@/inbox/inbox.module';
import { RabbitMqModule } from '@/rabbitmq/rabbitmq.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    MailModule,
    InboxModule,
    RabbitMqModule,
  ],
})
export class AppModule {}
