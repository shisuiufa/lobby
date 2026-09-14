import type { MAIL_DRIVER } from './mail.constant';

export type MailDriver = (typeof MAIL_DRIVER)[keyof typeof MAIL_DRIVER];

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface MailTransport {
  send(input: SendMailInput): Promise<void> | void;
}
