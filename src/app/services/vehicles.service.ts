import { ulid } from "ulid";
import prisma from "../../config/db.conn";
import { uploadImageBuffer } from "../../utils/cloudinary.utils";
import { ListVehicleInput } from "../validation/vehicles.validation";
import {
  getUserBranchOrThrow,
  NEARBY_LISTINGS_RADIUS_KM,
  toNum,
} from "./listings.shared";

const mapVehicle = (vehicle: {
  id: string;
  userId: string;
  title: string;
  vehicleType: string;
  description: string | null;
  photoUrls: string[];
  branch: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
  distanceKm?: number;
}) => ({
  id: vehicle.id,
  userId: vehicle.userId,
  title: vehicle.title,
  vehicleType: vehicle.vehicleType,
  description: vehicle.description,
  photoUrls: vehicle.photoUrls,
  branch: vehicle.branch,
  latitude: vehicle.latitude,
  longitude: vehicle.longitude,
  status: vehicle.status,
  createdAt: vehicle.createdAt,
  updatedAt: vehicle.updatedAt,
  ...(vehicle.distanceKm != null ? { distanceKm: vehicle.distanceKm } : {}),
});

export const listVehicleService = async (
  userId: string,
  body: ListVehicleInput,
  files: Express.Multer.File[]
) => {
  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  if (!files.length) {
    const err = new Error("At least one vehicle photo is required") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  const branch = getUserBranchOrThrow(dbUser.branchDetails);
  const listingId = ulid();

  const photoUrls: string[] = [];
  for (let i = 0; i < files.length; i += 1) {
    const uploaded = await uploadImageBuffer(
      files[i].buffer,
      "listings/vehicles",
      `vehicle_${userId}_${listingId}_${i + 1}`
    );
    photoUrls.push(uploaded.url);
  }

  const created = await prisma.vehicle.create({
    data: {
      id: listingId,
      userId,
      title: body.title,
      vehicleType: body.vehicleType,
      description: body.description?.trim() ? body.description.trim() : null,
      photoUrls,
      branch: branch.name,
      latitude: branch.latitude,
      longitude: branch.longitude,
      status: "PENDING",
    },
  });

  return mapVehicle(created);
};

export const getMyVehiclesService = async (userId: string) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return vehicles.map(mapVehicle);
};

type NearbyVehicleRow = {
  id: string;
  userId: string;
  title: string;
  vehicleType: string;
  description: string | null;
  photoUrls: string[];
  branch: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
  distance_km: number;
};

export const getNearbyApprovedVehiclesService = async (
  userLat: number,
  userLng: number
) => {
  const rows = await prisma.$queryRaw<NearbyVehicleRow[]>`
    SELECT * FROM (
      SELECT
        v.id,
        v."userId",
        v.title,
        v."vehicleType",
        v.description,
        v."photoUrls",
        v.branch,
        v.latitude,
        v.longitude,
        v.status,
        v."createdAt",
        v."updatedAt",
        (
          6371 * acos(
            LEAST(1::double precision, GREATEST(-1::double precision,
              cos(radians(${userLat})) * cos(radians(v.latitude)) * cos(radians(v.longitude) - radians(${userLng}))
              + sin(radians(${userLat})) * sin(radians(v.latitude))
            ))
          )
        ) AS distance_km
      FROM vehicle v
      WHERE v.status = 'APPROVED'
        AND v.latitude IS NOT NULL
        AND v.longitude IS NOT NULL
    ) sub
    WHERE sub.distance_km <= ${NEARBY_LISTINGS_RADIUS_KM}
    ORDER BY sub.distance_km ASC
  `;

  return {
    userLocation: { latitude: userLat, longitude: userLng },
    radiusKm: NEARBY_LISTINGS_RADIUS_KM,
    vehicles: rows.map((row) =>
      mapVehicle({
        ...row,
        distanceKm: Math.round(toNum(row.distance_km) * 100) / 100,
      })
    ),
  };
};
