import type { Prisma } from '@/prisma/generated/prisma/client';
import type { RoutingKey } from '@lobby/events';

export interface InboxEventInput {
  idempotencyId: string;
  routingKey: RoutingKey;
  payload: Prisma.InputJsonValue;
}
