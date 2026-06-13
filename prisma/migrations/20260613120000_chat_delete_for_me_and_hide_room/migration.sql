-- Per-user message hide (delete for me) and per-side chat hide (delete chat for me only)
ALTER TABLE "chat_room" ADD COLUMN "userHiddenAt" TIMESTAMP(3);
ALTER TABLE "chat_room" ADD COLUMN "workerHiddenAt" TIMESTAMP(3);

CREATE TABLE "chat_message_hidden" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_hidden_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chat_message_hidden_messageId_userId_key" ON "chat_message_hidden"("messageId", "userId");
CREATE INDEX "chat_message_hidden_userId_idx" ON "chat_message_hidden"("userId");

ALTER TABLE "chat_message_hidden" ADD CONSTRAINT "chat_message_hidden_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
