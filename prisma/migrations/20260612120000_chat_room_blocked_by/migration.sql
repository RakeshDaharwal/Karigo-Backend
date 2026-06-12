-- Add per-room block state. Userid of the participant who blocked the
-- conversation; null means the room is not blocked.
ALTER TABLE "public"."chat_room" ADD COLUMN "blockedBy" TEXT;
