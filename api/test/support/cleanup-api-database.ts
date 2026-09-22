import { PrismaService } from '@/prisma/prisma.service';

export async function cleanupApiDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRaw`
    TRUNCATE TABLE "outbox_events" RESTART IDENTITY CASCADE
  `;
}
