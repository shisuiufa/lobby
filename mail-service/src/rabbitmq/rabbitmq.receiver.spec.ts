import { ROUTING_KEY } from '@lobby/events';
import { RabbitmqReceiver } from './rabbitmq.receiver';
import type { RmqContext } from '@nestjs/microservices';
import type { InboxService } from '@/inbox/inbox.service';
import type { Channel, ConsumeMessage } from 'amqplib';

type InboxServiceMock = Pick<jest.Mocked<InboxService>, 'createIfNotExists'>;

type ChannelMock = Pick<jest.Mocked<Channel>, 'ack' | 'reject'>;

function createInboxServiceMock(): InboxServiceMock {
  return {
    createIfNotExists: jest.fn(),
  };
}

function createChannelMock(): ChannelMock {
  return {
    ack: jest.fn(),
    reject: jest.fn(),
  };
}

function createMessage(messageId?: string): ConsumeMessage {
  return {
    properties: {
      messageId,
    },
  } as ConsumeMessage;
}

function createRmqContext(
  channel: ChannelMock,
  message: ConsumeMessage,
): RmqContext {
  return {
    getChannelRef: () => channel,
    getMessage: () => message,
  } as unknown as RmqContext;
}

describe('RabbitmqReceiver', () => {
  let receiver: RabbitmqReceiver;

  let inboxService: InboxServiceMock;

  let channel: ChannelMock;

  const payload = { email: 'user@example.com', token: 'token' };

  beforeEach(() => {
    inboxService = createInboxServiceMock();

    channel = createChannelMock();

    receiver = new RabbitmqReceiver(inboxService as unknown as InboxService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rejects message without requeue when messageId is missing', async () => {
    const message = createMessage();

    const context = createRmqContext(channel, message);

    await receiver.receive(ROUTING_KEY.EMAIL_VERIFICATION, payload, context);

    expect(inboxService.createIfNotExists).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.reject).toHaveBeenCalledWith(message, false);
  });

  it('saves inbox event and acknowledges message', async () => {
    const message = createMessage('message');

    const context = createRmqContext(channel, message);

    await receiver.receive(ROUTING_KEY.EMAIL_VERIFICATION, payload, context);

    expect(inboxService.createIfNotExists).toHaveBeenCalledWith({
      idempotencyId: 'message',
      routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
      payload,
    });
    expect(channel.ack).toHaveBeenCalledWith(message);
    expect(channel.reject).not.toHaveBeenCalled();
  });

  it('rejects message with requeue when inbox event cannot be saved', async () => {
    inboxService.createIfNotExists.mockRejectedValueOnce(
      new Error('Database is unavailable'),
    );

    const message = createMessage('message');

    const context = createRmqContext(channel, message);

    await receiver.receive(ROUTING_KEY.EMAIL_VERIFICATION, payload, context);

    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.reject).toHaveBeenCalledWith(message, true);
  });
});
