-- Rename enums
ALTER TYPE "ShopCategory" RENAME TO "BusinessCategory";
ALTER TYPE "ShopStatus" RENAME TO "BusinessStatus";

-- Drop FK from store.shopId so we can rename it
ALTER TABLE "store" DROP CONSTRAINT IF EXISTS "store_shopId_fkey";

-- Rename column store.shopId -> store.businessId
ALTER TABLE "store" RENAME COLUMN "shopId" TO "businessId";

-- Rename the index on store
ALTER INDEX IF EXISTS "store_shopId_idx" RENAME TO "store_businessId_idx";

-- Rename shop table to business
ALTER TABLE "shop" RENAME TO "business";

-- Rename primary key and index on business
ALTER INDEX IF EXISTS "shop_pkey" RENAME TO "business_pkey";
ALTER INDEX IF EXISTS "shop_userId_idx" RENAME TO "business_userId_idx";

-- Rename FK on business
ALTER TABLE "business" RENAME CONSTRAINT "shop_userId_fkey" TO "business_userId_fkey";

-- Re-create FK on store -> business with the new name
ALTER TABLE "store"
  ADD CONSTRAINT "store_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "business"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
