-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- AlterTable: drop unused geo columns on Worker
ALTER TABLE "worker" DROP COLUMN IF EXISTS "country";
ALTER TABLE "worker" DROP COLUMN IF EXISTS "state";
ALTER TABLE "worker" DROP COLUMN IF EXISTS "district";

-- AlterTable: add partner type + business name to Worker
ALTER TABLE "worker" ADD COLUMN "partnerType" "PartnerType";
ALTER TABLE "worker" ADD COLUMN "businessName" TEXT;
