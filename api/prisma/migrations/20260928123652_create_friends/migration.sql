-- CreateTable
CREATE TABLE "friends" (
    "id" SERIAL NOT NULL,
    "first_user_id" TEXT NOT NULL,
    "second_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "friends_first_user_id_idx" ON "friends"("first_user_id");

-- CreateIndex
CREATE INDEX "friends_second_user_id_idx" ON "friends"("second_user_id");

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_first_user_id_fkey" FOREIGN KEY ("first_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_second_user_id_fkey" FOREIGN KEY ("second_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prevent duplicate and bidirectional friendships
CREATE UNIQUE INDEX "unique_friendship"
    ON "friends" (
                  LEAST("first_user_id", "second_user_id"),
                  GREATEST("first_user_id", "second_user_id")
        );

-- Prevent users from adding themselves as friends
ALTER TABLE "friends"
    ADD CONSTRAINT "no_self_friendship"
        CHECK ("first_user_id" <> "second_user_id");