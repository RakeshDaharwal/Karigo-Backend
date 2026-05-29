-- AlterTable: replace address/lat/lng columns with branchDetails JSON on User
ALTER TABLE "User" ADD COLUMN "branchDetails" JSONB;

UPDATE "User"
SET "branchDetails" = jsonb_build_object(
  'name', "branch",
  'latitude', "latitude",
  'longitude', "longitude"
)
WHERE "branch" IS NOT NULL
  AND "latitude" IS NOT NULL
  AND "longitude" IS NOT NULL;

ALTER TABLE "User" DROP COLUMN "country";
ALTER TABLE "User" DROP COLUMN "state";
ALTER TABLE "User" DROP COLUMN "district";
ALTER TABLE "User" DROP COLUMN "branch";
ALTER TABLE "User" DROP COLUMN "latitude";
ALTER TABLE "User" DROP COLUMN "longitude";
