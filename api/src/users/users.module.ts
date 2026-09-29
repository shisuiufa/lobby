import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from '@/users/users.repository';

@Module({
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
