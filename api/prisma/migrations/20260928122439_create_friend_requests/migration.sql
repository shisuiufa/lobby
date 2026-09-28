-- CreateEnum
CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED');

-- AlterTable
ALTER TABLE "email_verifications" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "friend_requests" (
    "id" SERIAL NOT NULL,
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "status" "FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "friend_requests_sender_id_status_created_at_idx" ON "friend_requests"("sender_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "friend_requests_recipient_id_status_created_at_idx" ON "friend_requests"("recipient_id", "status", "created_at");

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prevent duplicate and bidirectional pending friend requests
CREATE UNIQUE INDEX "unique_bidirectional_pending_request"
    ON "friend_requests" (
                          LEAST("sender_id", "recipient_id"),
                          GREATEST("sender_id", "recipient_id")
    )
WHERE "status" = 'PENDING';

-- Prevent users from sending friend requests to themselves
ALTER TABLE "friend_requests"
    ADD CONSTRAINT "no_self_friend_request"
        CHECK ("sender_id" <> "recipient_id");
