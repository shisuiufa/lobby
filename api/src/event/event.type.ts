import { EXCHANGE, ROUTING_KEY, EmailVerificationPayload } from '@lobby/events';

export interface EventPayloadMap {
  [EXCHANGE.AUTH]: {
    [ROUTING_KEY.EMAIL_VERIFICATION]: EmailVerificationPayload;
  };
}

export type AppEvent = {
  [E in keyof EventPayloadMap]: {
    [R in keyof EventPayloadMap[E]]: {
      exchangeName: E;
      routingKey: R;
      payload: EventPayloadMap[E][R];
    };
  }[keyof EventPayloadMap[E]];
}[keyof EventPayloadMap];
