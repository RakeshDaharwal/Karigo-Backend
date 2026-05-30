import { ulid } from "ulid";
import prisma from "../../config/db.conn";
import { ShopCategory } from "../../generated/prisma/enums";
import { uploadImageBuffer } from "../../utils/cloudinary.utils";
import { OnboardShopInput } from "../validation/shops.validation";

const branchInfoFromDetails = (details: unknown) => {
  if (!details || typeof details !== "object") {
    return { name: null as string | null, latitude: null as number | null, longitude: null as number | null };
  }
  const obj = details as Record<string, unknown>;
  const name = typeof obj.name === "string" ? obj.name : null;
  const lat = typeof obj.latitude === "number" ? obj.latitude : null;
  const lng = typeof obj.longitude === "number" ? obj.longitude : null;
  return { name, latitude: lat, longitude: lng };
};

export const onboardShopService = async (
  userId: string,
  body: OnboardShopInput,
  file?: Express.Multer.File
) => {
  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  if (!file) {
    const err = new Error("Shop logo is required") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  const branch = branchInfoFromDetails(dbUser.branchDetails);
  if (!branch.name || branch.latitude == null || branch.longitude == null) {
    const err = new Error(
      "Please select your branch before onboarding a shop"
    ) as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  const existingPending = await prisma.shop.findFirst({
    where: { userId, status: "PENDING" },
  });
  if (existingPending) {
    const err = new Error(
      "You already have a pending shop onboarding request"
    ) as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }

  const shopScopeId = ulid();
  const uploaded = await uploadImageBuffer(
    file.buffer,
    "shops/logos",
    `shop_${userId}_${shopScopeId}`
  );

  const created = await prisma.shop.create({
    data: {
      id: shopScopeId,
      userId,
      name: body.name,
      description: body.description,
      category: body.category as ShopCategory,
      contactPhone: body.contactPhone,
      logoUrl: uploaded.url,
      branch: branch.name,
      latitude: branch.latitude,
      longitude: branch.longitude,
      status: "PENDING",
    },
  });

  return created;
};

export const getMyShopsService = async (userId: string) => {
  const shops = await prisma.shop.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return shops;
};

const NEARBY_SHOPS_RADIUS_KM = 5;

type NearbyShopRow = {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: ShopCategory;
  contactPhone: string;
  logoUrl: string;
  branch: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
  distance_km: number;
};

const toNum = (v: unknown) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  if (
    v &&
    typeof v === "object" &&
    "toNumber" in v &&
    typeof (v as { toNumber: () => number }).toNumber === "function"
  ) {
    return (v as { toNumber: () => number }).toNumber();
  }
  return Number(v);
};

export const getNearbyApprovedShopsService = async (
  userLat: number,
  userLng: number
) => {
  const rows = await prisma.$queryRaw<NearbyShopRow[]>`
    SELECT * FROM (
      SELECT
        s.id,
        s."userId",
        s.name,
        s.description,
        s.category,
        s."contactPhone",
        s."logoUrl",
        s.branch,
        s.latitude,
        s.longitude,
        s.status,
        s."createdAt",
        s."updatedAt",
        (
          6371 * acos(
            LEAST(1::double precision, GREATEST(-1::double precision,
              cos(radians(${userLat})) * cos(radians(s.latitude)) * cos(radians(s.longitude) - radians(${userLng}))
              + sin(radians(${userLat})) * sin(radians(s.latitude))
            ))
          )
        ) AS distance_km
      FROM shop s
      WHERE s.status = 'APPROVED'
        AND s.latitude IS NOT NULL
        AND s.longitude IS NOT NULL
    ) sub
    WHERE sub.distance_km <= ${NEARBY_SHOPS_RADIUS_KM}
    ORDER BY sub.distance_km ASC
  `;

  return {
    userLocation: { latitude: userLat, longitude: userLng },
    radiusKm: NEARBY_SHOPS_RADIUS_KM,
    shops: rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      name: row.name,
      description: row.description,
      category: row.category,
      contactPhone: row.contactPhone,
      logoUrl: row.logoUrl,
      branch: row.branch,
      latitude: row.latitude,
      longitude: row.longitude,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      distanceKm: Math.round(toNum(row.distance_km) * 100) / 100,
    })),
  };
};
