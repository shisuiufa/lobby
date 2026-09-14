export const ROUTING_KEY = {
  EMAIL_VERIFICATION: 'email.verification',
} as const;

export type RoutingKey =
  (typeof ROUTING_KEY)[keyof typeof ROUTING_KEY];