import { Exclude } from 'class-transformer';

export class UserEntity {
  id: string;
  email: string;
  username: string;
  displayName: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;

  @Exclude()
  passwordHash: string;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  sessions: unknown;

  @Exclude()
  emailVerification: unknown;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
