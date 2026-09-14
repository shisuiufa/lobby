import { UserEntity } from '@/users/user.entity';

export class AuthResponseDto {
  user: UserEntity;
  accessToken: string;
  refreshToken: string;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
