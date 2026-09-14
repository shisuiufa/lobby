-- CreateEnum
CREATE TYPE "InboxStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "inbox_events" (
    "id" SERIAL NOT NULL,
    "idempotency_id" TEXT NOT NULL,
    "routing_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3),
    "status" "InboxStatus" NOT NULL DEFAULT 'RECEIVED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inbox_events_idempotency_id_key" ON "inbox_events"("idempotency_id");

-- CreateIndex
CREATE INDEX "inbox_events_status_next_attempt_at_created_at_idx" ON "inbox_events"("status", "next_attempt_at", "created_at");
