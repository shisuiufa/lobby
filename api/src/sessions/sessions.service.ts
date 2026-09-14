import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { Session } from '@/prisma/generated/prisma/client';
import { CreateSessionInput } from '@/sessions/session.type';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createSessionInput: CreateSessionInput): Promise<Session> {
    return this.prisma.session.create({
      data: createSessionInput,
    });
  }

  findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { id },
    });
  }

  findByHash(hash: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
    });
  }

  revokeById(id: string): Promise<Session> {
    return this.prisma.session.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  updateHashById(id: string, hash: string): Promise<Session> {
    return this.prisma.session.update({
      where: { id },
      data: { refreshTokenHash: hash },
    });
  }
}
