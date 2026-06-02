-- Drop businesses still using removed categories so the type swap can proceed
DELETE FROM "business"
WHERE "category"::text IN ('CLOTHING', 'SALON', 'RESTAURANT', 'STATIONERY', 'OTHER');

-- Define the new enum
CREATE TYPE "BusinessCategory_new" AS ENUM (
  'FOOD',
  'GROCERY',
  'PHARMACY',
  'HEALTHCARE',
  'HARDWARE',
  'ELECTRONICS',
  'MOBILE',
  'FASHION',
  'FOOTWEAR',
  'FURNITURE',
  'BEAUTY',
  'FITNESS',
  'SPORTS'
);

-- Switch the column over to the new enum (only matching values remain)
ALTER TABLE "business"
  ALTER COLUMN "category" TYPE "BusinessCategory_new"
  USING ("category"::text::"BusinessCategory_new");

-- Replace the old enum with the new one
DROP TYPE "BusinessCategory";
ALTER TYPE "BusinessCategory_new" RENAME TO "BusinessCategory";
