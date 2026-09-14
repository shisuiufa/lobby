export interface MailTemplate {
  subject: string;
  text: string;
  html?: string;
}

export interface VerifyEmailTemplateInput {
  verificationUrl: string;
}
