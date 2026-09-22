import { ROUTING_KEY } from '@lobby/events';
import { MailDispatcher } from '@/mail/mail.dispatcher';
import { MailService } from '@/mail/mail.service';
import { InboxStatus, type InboxEvent } from '@/prisma/generated/prisma/client';

describe('MailDispatcher', () => {
  const event = {
    id: 1,
    idempotencyId: 'message-1',
    routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
    payload: {
      email: 'user@example.com',
      token: 'token',
    },
    retries: 0,
    nextAttemptAt: null,
    status: InboxStatus.RECEIVED,
    createdAt: new Date('2026-09-15T00:00:00.000Z'),
    updatedAt: new Date('2026-09-15T00:00:00.000Z'),
  } as InboxEvent;

  it('dispatches email verification events to MailService', async () => {
    const mailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };
    const dispatcher = new MailDispatcher(
      mailService as unknown as MailService,
    );

    await dispatcher.dispatch(event);

    expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
      event.payload,
    );
  });

  it('rejects unsupported routing keys', async () => {
    const mailService = {
      sendVerificationEmail: jest.fn(),
    };
    const dispatcher = new MailDispatcher(
      mailService as unknown as MailService,
    );
    const unsupportedEvent = { ...event };
    Object.defineProperty(unsupportedEvent, 'routingKey', {
      value: 'unsupported.event',
    });

    await expect(dispatcher.dispatch(unsupportedEvent)).rejects.toThrow(
      'Unsupported routing key',
    );
  });
});
