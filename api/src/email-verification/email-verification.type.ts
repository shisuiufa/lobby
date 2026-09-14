export interface CreateEmailVerificationInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}
