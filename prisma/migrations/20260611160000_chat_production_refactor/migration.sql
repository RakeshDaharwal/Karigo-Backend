-- Chat production refactor: message status, receiver, async-friendly denormalized room fields + indexes

-- 1. Message status enum
CREATE TYPE "public"."MessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'SEEN');

-- 2. New ChatMessage columns (nullable first so we can backfill)
ALTER TABLE "public"."chat_message"
  ADD COLUMN "receiverId" TEXT,
  ADD COLUMN "status" "public"."MessageStatus" NOT NULL DEFAULT 'SENT',
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "seenAt" TIMESTAMP(3);

-- 3. Backfill receiverId as "the other party" of the room
UPDATE "public"."chat_message" AS m
SET "receiverId" = CASE
    WHEN m."senderId" = r."userId" THEN w."userId"
    ELSE r."userId"
  END
FROM "public"."chat_room" AS r
JOIN "public"."worker" AS w ON w."id" = r."workerId"
WHERE m."roomId" = r."id";

-- 4. Backfill status from legacy isRead, then drop isRead
UPDATE "public"."chat_message" SET "status" = 'SEEN' WHERE "isRead" = true;
UPDATE "public"."chat_message" SET "seenAt" = "createdAt" WHERE "isRead" = true;
ALTER TABLE "public"."chat_message" DROP COLUMN "isRead";

-- 5. Enforce NOT NULL on receiverId after backfill
ALTER TABLE "public"."chat_message" ALTER COLUMN "receiverId" SET NOT NULL;

-- 6. ChatRoom denormalized preview + unread counters
ALTER TABLE "public"."chat_room"
  ADD COLUMN "lastMessageId" TEXT,
  ADD COLUMN "lastMessageContent" TEXT,
  ADD COLUMN "lastMessageSenderId" TEXT,
  ADD COLUMN "lastMessageAt" TIMESTAMP(3),
  ADD COLUMN "userUnreadCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "workerUnreadCount" INTEGER NOT NULL DEFAULT 0;

-- 7. Backfill room preview from latest message per room
UPDATE "public"."chat_room" AS r
SET
  "lastMessageId" = lm."id",
  "lastMessageContent" = lm."content",
  "lastMessageSenderId" = lm."senderId",
  "lastMessageAt" = lm."createdAt"
FROM (
  SELECT DISTINCT ON ("roomId") "roomId", "id", "content", "senderId", "createdAt"
  FROM "public"."chat_message"
  ORDER BY "roomId", "createdAt" DESC
) AS lm
WHERE r."id" = lm."roomId";

-- 8. Indexes: drop legacy single-column message index, add optimized set
DROP INDEX IF EXISTS "public"."chat_message_roomId_idx";

CREATE INDEX "chat_message_roomId_createdAt_idx" ON "public"."chat_message" ("roomId", "createdAt" DESC);
CREATE INDEX "chat_message_senderId_idx" ON "public"."chat_message" ("senderId");
CREATE INDEX "chat_message_receiverId_idx" ON "public"."chat_message" ("receiverId");
CREATE INDEX "chat_message_createdAt_idx" ON "public"."chat_message" ("createdAt");
CREATE INDEX "chat_message_receiverId_status_idx" ON "public"."chat_message" ("receiverId", "status");

CREATE INDEX "chat_room_lastMessageAt_idx" ON "public"."chat_room" ("lastMessageAt" DESC);
