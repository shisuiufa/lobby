import type { Request } from 'express';
import type { JwtPayload } from '@/auth/types';
import type { User } from '@/prisma/generated/prisma/client';

export interface AuthRequest extends Request {
  user: JwtPayload;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface EmailVerificationToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}
