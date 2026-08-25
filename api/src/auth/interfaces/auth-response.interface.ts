import type { User } from '@/users/interfaces';

export interface AuthResponse {
  user: User;
  accessToken: string;
}
