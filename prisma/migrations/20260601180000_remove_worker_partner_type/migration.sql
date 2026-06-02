-- AlterTable
ALTER TABLE "worker" DROP COLUMN IF EXISTS "partnerType";
ALTER TABLE "worker" DROP COLUMN IF EXISTS "businessName";

-- DropEnum
DROP TYPE IF EXISTS "PartnerType";
