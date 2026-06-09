-- Add icon URL and optional sort order to worker categories.
-- No backfill: existing rows keep sortOrder NULL; app assigns on create, admin rewrites on reorder.
-- Partial unique indexes enforce name/order uniqueness only among active rows.

-- 1. New nullable columns
ALTER TABLE "public"."worker_category"
  ADD COLUMN "iconUrl" TEXT,
  ADD COLUMN "sortOrder" INTEGER;

ALTER TABLE "public"."worker_subcategory"
  ADD COLUMN "sortOrder" INTEGER;

-- 2. Standard indexes (Prisma-managed)
CREATE INDEX "worker_category_sortOrder_idx" ON "public"."worker_category"("sortOrder");
CREATE INDEX "worker_category_deletedAt_idx" ON "public"."worker_category"("deletedAt");

CREATE INDEX "worker_subcategory_categoryId_idx" ON "public"."worker_subcategory"("categoryId");
CREATE INDEX "worker_subcategory_categoryId_sortOrder_idx" ON "public"."worker_subcategory"("categoryId", "sortOrder");
CREATE INDEX "worker_subcategory_deletedAt_idx" ON "public"."worker_subcategory"("deletedAt");

-- 3. Partial unique indexes (active records only)
CREATE UNIQUE INDEX "worker_category_name_active_unique"
  ON "public"."worker_category" (LOWER("name"))
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "worker_category_sort_order_active_unique"
  ON "public"."worker_category" ("sortOrder")
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "worker_subcategory_name_active_unique"
  ON "public"."worker_subcategory" ("categoryId", LOWER("name"))
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "worker_subcategory_sort_order_active_unique"
  ON "public"."worker_subcategory" ("categoryId", "sortOrder")
  WHERE "deletedAt" IS NULL;
