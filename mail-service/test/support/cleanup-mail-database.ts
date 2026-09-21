import { PrismaService } from '@/prisma/prisma.service';

export async function cleanupMailDatabase(
  prisma: PrismaService,
): Promise<void> {
  await prisma.$executeRaw`
    TRUNCATE TABLE "inbox_events" RESTART IDENTITY CASCADE
  `;
}
