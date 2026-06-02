-- Create business_category table to replace the static BusinessCategory enum
CREATE TABLE "business_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "business_category_pkey" PRIMARY KEY ("id")
);

-- Seed with the previously-hardcoded categories so existing businesses can be backfilled.
INSERT INTO "business_category" ("id", "name", "createdAt", "updatedAt") VALUES
  ('11111111-1111-1111-1111-111111110001', 'Food', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-1111-1111-111111110002', 'Grocery', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-1111-1111-111111110003', 'Pharmacy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-1111-1111-111111110004', 'Healthcare', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-1111-1111-111111110005', 'Hardware', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-1111-1111-111111110006', 'Electronics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-1111-1111-111111110007', 'Mobile', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-1111-1111-111111110008', 'Fashion', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-1111-1111-111111110009', 'Footwear', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-1111-1111-111111110010', 'Furniture', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-1111-1111-111111110011', 'Beauty', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-1111-1111-111111110012', 'Fitness', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-1111-1111-111111110013', 'Sports', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add the new FK column to business
ALTER TABLE "business" ADD COLUMN "categoryId" TEXT;

-- Backfill categoryId from the legacy enum column
UPDATE "business" SET "categoryId" = '11111111-1111-1111-1111-111111110001' WHERE "category"::text = 'FOOD';
UPDATE "business" SET "categoryId" = '11111111-1111-1111-1111-111111110002' WHERE "category"::text = 'GROCERY';
UPDATE "business" SET "categoryId" = '11111111-1111-1111-1111-111111110003' WHERE "category"::text = 'PHARMACY';
UPDATE "business" SET "categoryId" = '11111111-1111-1111-1111-111111110004' WHERE "category"::text = 'HEALTHCARE';
UPDATE "business" SET "categoryId" = '11111111-1111-1111-1111-111111110005' WHERE "category"::text = 'HARDWARE';
UPDATE "business" SET "categoryId" = '11111111-1111-1111-1111-111111110006' WHERE "category"::text = 'ELECTRONICS';
UPDATE "business" SET "categoryId" = '11111111-1111-1111-1111-111111110007' WHERE "category"::text = 'MOBILE';
UPDATE "business" SET "categoryId" = '11111111-1111-1111-1111-111111110008' WHERE "category"::text = 'FASHION';
UPDATE "business" SET "categoryId" = '11111111-1111-1111-1111-111111110009' WHERE "category"::text = 'FOOTWEAR';
UPDATE "business" SET "categoryId" = '11111111-1111-1111-1111-111111110010' WHERE "category"::text = 'FURNITURE';
UPDATE "business" SET "categoryId" = '11111111-1111-1111-1111-111111110011' WHERE "category"::text = 'BEAUTY';
UPDATE "business" SET "categoryId" = '11111111-1111-1111-1111-111111110012' WHERE "category"::text = 'FITNESS';
UPDATE "business" SET "categoryId" = '11111111-1111-1111-1111-111111110013' WHERE "category"::text = 'SPORTS';

-- Enforce NOT NULL after the backfill
ALTER TABLE "business" ALTER COLUMN "categoryId" SET NOT NULL;

-- Drop the legacy enum column and type
ALTER TABLE "business" DROP COLUMN "category";
DROP TYPE "BusinessCategory";

-- Add FK + supporting index
CREATE INDEX "business_categoryId_idx" ON "business"("categoryId");
ALTER TABLE "business"
  ADD CONSTRAINT "business_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "business_category"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
