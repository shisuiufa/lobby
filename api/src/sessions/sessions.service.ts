import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSessionDto } from '@/sessions/dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createSessionDto: CreateSessionDto) {
    return this.prisma.session.create({
      data: createSessionDto,
    });
  }

  findById(id: string) {
    return this.prisma.session.findUnique({
      where: { id },
    });
  }

  findByHash(hash: string) {
    return this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
    });
  }

  revokeById(id: string) {
    return this.prisma.session.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  updateHashById(id: string, hash: string) {
    return this.prisma.session.update({
      where: { id },
      data: { refreshTokenHash: hash },
    });
  }
}
