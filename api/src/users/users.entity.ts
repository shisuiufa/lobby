import { Exclude } from 'class-transformer';

export class UsersEntity {
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

  constructor(partial: Partial<UsersEntity>) {
    Object.assign(this, partial);
  }
}
