import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEmailVerificationInput } from '@/email-verification/email-verification.type';
import { Prisma, EmailVerification } from '@/prisma/generated/prisma/client';

@Injectable()
export class EmailVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    input: CreateEmailVerificationInput,
    tx?: Prisma.TransactionClient,
  ): Promise<EmailVerification> {
    const db = tx ?? this.prisma;

    return db.emailVerification.create({
      data: input,
    });
  }

  findByUserId(id: string): Promise<EmailVerification | null> {
    return this.prisma.emailVerification.findUnique({
      where: { userId: id },
    });
  }

  findByTokenHash(tokenHash: string): Promise<EmailVerification | null> {
    return this.prisma.emailVerification.findUnique({
      where: { tokenHash },
    });
  }

  delete(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<EmailVerification> {
    const db = tx ?? this.prisma;

    return db.emailVerification.delete({ where: { id } });
  }
}
