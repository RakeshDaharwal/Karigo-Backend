import { ulid } from "ulid";
import prisma from "../../config/db.conn";
import { uploadImageBuffer } from "../../utils/cloudinary.utils";
import { ListHouseInput } from "../validation/houses.validation";
import {
  getUserBranchOrThrow,
  NEARBY_LISTINGS_RADIUS_KM,
  toNum,
} from "./listings.shared";

const mapHouse = (house: {
  id: string;
  userId: string;
  title: string;
  propertyType: string;
  houseType: string | null;
  description: string | null;
  monthlyRent: number | { toNumber?: () => number };
  securityDeposit: number | { toNumber?: () => number } | null;
  maintenanceCharges: number | { toNumber?: () => number } | null;
  ownerName: string | null;
  mobileNumber: string | null;
  photoUrl: string;
  branch: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
  distanceKm?: number;
}) => ({
  id: house.id,
  userId: house.userId,
  title: house.title,
  propertyType: house.propertyType,
  houseType: house.houseType,
  description: house.description,
  monthlyRent: toNum(house.monthlyRent),
  securityDeposit:
    house.securityDeposit == null ? null : toNum(house.securityDeposit),
  maintenanceCharges:
    house.maintenanceCharges == null ? null : toNum(house.maintenanceCharges),
  ownerName: house.ownerName,
  mobileNumber: house.mobileNumber,
  photoUrl: house.photoUrl,
  branch: house.branch,
  latitude: house.latitude,
  longitude: house.longitude,
  status: house.status,
  createdAt: house.createdAt,
  updatedAt: house.updatedAt,
  ...(house.distanceKm != null ? { distanceKm: house.distanceKm } : {}),
});

export const listHouseService = async (
  userId: string,
  body: ListHouseInput,
  file?: Express.Multer.File
) => {
  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  if (!file) {
    const err = new Error("Property photo is required") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  const branch = getUserBranchOrThrow(dbUser.branchDetails);
  const listingId = ulid();
  const uploaded = await uploadImageBuffer(
    file.buffer,
    "listings/houses",
    `house_${userId}_${listingId}`
  );

  const created = await prisma.house.create({
    data: {
      id: listingId,
      userId,
      title: body.title,
      propertyType: body.propertyType,
      houseType: body.houseType?.trim() ? body.houseType.trim() : null,
      description: body.description?.trim() ? body.description.trim() : null,
      monthlyRent: body.monthlyRent,
      securityDeposit: body.securityDeposit ?? null,
      maintenanceCharges: body.maintenanceCharges ?? null,
      ownerName: body.ownerName?.trim() ? body.ownerName.trim() : null,
      mobileNumber: body.mobileNumber?.trim() ? body.mobileNumber.trim() : null,
      photoUrl: uploaded.url,
      branch: branch.name,
      latitude: branch.latitude,
      longitude: branch.longitude,
      status: "PENDING",
    },
  });

  return mapHouse(created);
};

export const getMyHousesService = async (userId: string) => {
  const houses = await prisma.house.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return houses.map(mapHouse);
};

type NearbyHouseRow = {
  id: string;
  userId: string;
  title: string;
  propertyType: string;
  houseType: string | null;
  description: string | null;
  monthlyRent: number;
  securityDeposit: number | null;
  maintenanceCharges: number | null;
  ownerName: string | null;
  mobileNumber: string | null;
  photoUrl: string;
  branch: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
  distance_km: number;
};

export const getNearbyApprovedHousesService = async (
  userLat: number,
  userLng: number
) => {
  const rows = await prisma.$queryRaw<NearbyHouseRow[]>`
    SELECT * FROM (
      SELECT
        h.id,
        h."userId",
        h.title,
        h."propertyType",
        h."houseType",
        h.description,
        h."monthlyRent",
        h."securityDeposit",
        h."maintenanceCharges",
        h."ownerName",
        h."mobileNumber",
        h."photoUrl",
        h.branch,
        h.latitude,
        h.longitude,
        h.status,
        h."createdAt",
        h."updatedAt",
        (
          6371 * acos(
            LEAST(1::double precision, GREATEST(-1::double precision,
              cos(radians(${userLat})) * cos(radians(h.latitude)) * cos(radians(h.longitude) - radians(${userLng}))
              + sin(radians(${userLat})) * sin(radians(h.latitude))
            ))
          )
        ) AS distance_km
      FROM house h
      WHERE h.status = 'APPROVED'
        AND h.latitude IS NOT NULL
        AND h.longitude IS NOT NULL
    ) sub
    WHERE sub.distance_km <= ${NEARBY_LISTINGS_RADIUS_KM}
    ORDER BY sub.distance_km ASC
  `;

  return {
    userLocation: { latitude: userLat, longitude: userLng },
    radiusKm: NEARBY_LISTINGS_RADIUS_KM,
    houses: rows.map((row) =>
      mapHouse({
        ...row,
        distanceKm: Math.round(toNum(row.distance_km) * 100) / 100,
      })
    ),
  };
};
