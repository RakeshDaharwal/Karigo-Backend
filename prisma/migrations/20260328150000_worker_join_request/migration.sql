CREATE TABLE "WorkerJoinRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "aadhaarImageUrl" TEXT NOT NULL,
    "subCategoryIds" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerJoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkerJoinRequest_userId_idx" ON "WorkerJoinRequest"("userId");
CREATE INDEX "WorkerJoinRequest_categoryId_idx" ON "WorkerJoinRequest"("categoryId");

ALTER TABLE "WorkerJoinRequest" ADD CONSTRAINT "WorkerJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkerJoinRequest" ADD CONSTRAINT "WorkerJoinRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
