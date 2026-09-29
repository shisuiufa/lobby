import { UsersEntity } from '@/users/users.entity';

export class AuthResponseDto {
  user: UsersEntity;
  accessToken: string;
  refreshToken: string;

  constructor(data: AuthResponseDto) {
    Object.assign(this, data);
  }
}
