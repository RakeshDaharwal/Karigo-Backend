-- CreateEnum
CREATE TYPE "public"."PropertyType" AS ENUM ('ROOM', 'PG', 'FLAT', 'HOUSE', 'OFFICE', 'SHOP');

-- CreateEnum
CREATE TYPE "public"."VehicleType" AS ENUM ('BIKE', 'AUTO', 'PICKUP', 'MINI_TRUCK', 'TRUCK', 'TRACTOR', 'JCB');

-- CreateTable
CREATE TABLE "public"."house" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "propertyType" "public"."PropertyType" NOT NULL,
    "houseType" TEXT,
    "description" TEXT,
    "monthlyRent" DOUBLE PRECISION NOT NULL,
    "securityDeposit" DOUBLE PRECISION,
    "maintenanceCharges" DOUBLE PRECISION,
    "ownerName" TEXT,
    "mobileNumber" TEXT,
    "photoUrl" TEXT NOT NULL,
    "branch" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "public"."BusinessStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "house_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vehicleType" "public"."VehicleType" NOT NULL,
    "description" TEXT,
    "photoUrls" TEXT[],
    "branch" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "public"."BusinessStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "house_userId_idx" ON "public"."house"("userId");

-- CreateIndex
CREATE INDEX "house_status_idx" ON "public"."house"("status");

-- CreateIndex
CREATE INDEX "vehicle_userId_idx" ON "public"."vehicle"("userId");

-- CreateIndex
CREATE INDEX "vehicle_status_idx" ON "public"."vehicle"("status");

-- AddForeignKey
ALTER TABLE "public"."house" ADD CONSTRAINT "house_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle" ADD CONSTRAINT "vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
