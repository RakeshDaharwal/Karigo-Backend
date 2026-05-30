-- CreateTable
CREATE TABLE "store" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "openTime" TEXT,
  "closeTime" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_userId_idx" ON "store"("userId");

-- AddForeignKey
ALTER TABLE "store"
  ADD CONSTRAINT "store_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "product" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_storeId_idx" ON "product"("storeId");

-- AddForeignKey
ALTER TABLE "product"
  ADD CONSTRAINT "product_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "store"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
