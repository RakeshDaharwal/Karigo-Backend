-- Add icon URL and optional sort order to business categories.
-- Partial unique indexes enforce name/order uniqueness only among active rows.

-- 1. New nullable columns
ALTER TABLE "public"."business_category"
  ADD COLUMN "iconUrl" TEXT,
  ADD COLUMN "sortOrder" INTEGER;

-- 2. Standard indexes
CREATE INDEX "business_category_sortOrder_idx" ON "public"."business_category"("sortOrder");
CREATE INDEX "business_category_deletedAt_idx" ON "public"."business_category"("deletedAt");

-- 3. Partial unique indexes (active records only)
CREATE UNIQUE INDEX "business_category_name_active_unique"
  ON "public"."business_category" (LOWER("name"))
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "business_category_sort_order_active_unique"
  ON "public"."business_category" ("sortOrder")
  WHERE "deletedAt" IS NULL;

-- 4. Backfill sortOrder for existing seeded categories (alphabetical)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY LOWER("name") ASC) - 1 AS ord
  FROM "public"."business_category"
  WHERE "deletedAt" IS NULL
)
UPDATE "public"."business_category" bc
SET "sortOrder" = ranked.ord
FROM ranked
WHERE bc.id = ranked.id;
