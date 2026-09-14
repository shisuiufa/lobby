import type { Request } from 'express';
import type { JwtPayload } from '@/auth/types';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
