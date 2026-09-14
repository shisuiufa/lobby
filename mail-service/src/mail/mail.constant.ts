export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');

export const MAIL_DRIVER = {
  CONSOLE: 'console',
  SMTP: 'smtp',
} as const;

export const VERIFY_EMAIL_ENDPOINT = '/verify-email';
