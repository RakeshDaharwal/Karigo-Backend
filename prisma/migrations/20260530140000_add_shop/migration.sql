-- CreateEnum
CREATE TYPE "ShopCategory" AS ENUM (
  'FOOD',
  'GROCERY',
  'HARDWARE',
  'PHARMACY',
  'ELECTRONICS',
  'CLOTHING',
  'SALON',
  'RESTAURANT',
  'STATIONERY',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "shop" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" "ShopCategory" NOT NULL,
  "contactPhone" TEXT NOT NULL,
  "logoUrl" TEXT NOT NULL,
  "status" "ShopStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "shop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shop_userId_idx" ON "shop"("userId");

-- AddForeignKey
ALTER TABLE "shop"
  ADD CONSTRAINT "shop_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
