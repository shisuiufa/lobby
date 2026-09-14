import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { Prisma, User } from '@/prisma/generated/prisma/client';
import { CreateUserInput } from '@/users/user.type';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    createUserInput: CreateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const db = tx ?? this.prisma;

    return db.user.create({
      data: createUserInput,
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      omit: {
        passwordHash: false,
      },
    });
  }

  markEmailVerified(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const db = tx ?? this.prisma;

    return db.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }
}
