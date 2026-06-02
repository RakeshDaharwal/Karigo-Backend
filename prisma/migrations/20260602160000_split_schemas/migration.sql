-- Reorganize database into three schemas: public, business, commerce.
-- Renames legacy PascalCase tables to snake_case mapped names from the new Prisma schema,
-- creates new namespaces, and relocates tables and enum types accordingly.
-- Foreign keys, indexes, and primary key constraints follow their tables automatically;
-- constraint names are renamed for naming consistency with the new table names.

-- 1. Create the new schemas
CREATE SCHEMA IF NOT EXISTS "business";
CREATE SCHEMA IF NOT EXISTS "commerce";

-- 2. Rename legacy PascalCase tables to snake_case in public schema
ALTER TABLE "public"."User" RENAME TO "user";
ALTER TABLE "public"."Category" RENAME TO "worker_category";
ALTER TABLE "public"."SubCategory" RENAME TO "worker_subcategory";
ALTER TABLE "public"."ChatRoom" RENAME TO "chat_room";
ALTER TABLE "public"."ChatMessage" RENAME TO "chat_message";

-- 3. Rename PK / unique / index / FK constraints for naming consistency
ALTER INDEX "public"."User_pkey" RENAME TO "user_pkey";
ALTER INDEX "public"."User_mobile_key" RENAME TO "user_mobile_key";

ALTER INDEX "public"."Category_pkey" RENAME TO "worker_category_pkey";

ALTER INDEX "public"."SubCategory_pkey" RENAME TO "worker_subcategory_pkey";
ALTER TABLE "public"."worker_subcategory"
  RENAME CONSTRAINT "SubCategory_categoryId_fkey" TO "worker_subcategory_categoryId_fkey";

ALTER INDEX "public"."ChatRoom_pkey" RENAME TO "chat_room_pkey";
ALTER INDEX "public"."ChatRoom_userId_idx" RENAME TO "chat_room_userId_idx";
ALTER INDEX "public"."ChatRoom_workerId_idx" RENAME TO "chat_room_workerId_idx";
ALTER INDEX "public"."ChatRoom_userId_workerId_key" RENAME TO "chat_room_userId_workerId_key";
ALTER TABLE "public"."chat_room"
  RENAME CONSTRAINT "ChatRoom_userId_fkey" TO "chat_room_userId_fkey";
ALTER TABLE "public"."chat_room"
  RENAME CONSTRAINT "ChatRoom_workerId_fkey" TO "chat_room_workerId_fkey";

ALTER INDEX "public"."ChatMessage_pkey" RENAME TO "chat_message_pkey";
ALTER INDEX "public"."ChatMessage_roomId_idx" RENAME TO "chat_message_roomId_idx";
ALTER TABLE "public"."chat_message"
  RENAME CONSTRAINT "ChatMessage_roomId_fkey" TO "chat_message_roomId_fkey";

-- 4. Move tables to the business schema
ALTER TABLE "public"."store" SET SCHEMA "business";
ALTER TABLE "public"."product" SET SCHEMA "business";

-- 5. Move tables to the commerce schema
ALTER TABLE "public"."cart" SET SCHEMA "commerce";
ALTER TABLE "public"."cart_item" SET SCHEMA "commerce";
ALTER TABLE "public"."order" SET SCHEMA "commerce";
ALTER TABLE "public"."order_item" SET SCHEMA "commerce";

-- 6. Move enum types to the commerce schema (used by commerce.order)
ALTER TYPE "public"."OrderStatus" SET SCHEMA "commerce";
ALTER TYPE "public"."PaymentStatus" SET SCHEMA "commerce";
ALTER TYPE "public"."PaymentMethod" SET SCHEMA "commerce";
