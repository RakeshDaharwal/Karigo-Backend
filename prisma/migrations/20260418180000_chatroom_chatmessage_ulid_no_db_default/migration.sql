-- ChatRoom / ChatMessage ids are application-generated ULIDs (Prisma @id without default).
-- Drop DB-side defaults if a previous deploy added them for uuid().
ALTER TABLE "ChatRoom" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "ChatMessage" ALTER COLUMN "id" DROP DEFAULT;
