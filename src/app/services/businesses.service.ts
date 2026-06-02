import { ulid } from "ulid";
import prisma from "../../config/db.conn";
import { uploadImageBuffer } from "../../utils/cloudinary.utils";
import { findBusinessCategoryById } from "../../repositories/business_category.repository";
import { OnboardBusinessInput } from "../validation/businesses.validation";

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

const mapBusinessForResponse = (business: {
  id: string;
  userId: string;
  name: string;
  description: string;
  contactPhone: string;
  logoUrl: string;
  branch: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  category?: { id: string; name: string } | null;
}) => ({
  id: business.id,
  userId: business.userId,
  name: business.name,
  description: business.description,
  category: business.category
    ? { id: business.category.id, name: business.category.name }
    : { id: business.categoryId, name: "" },
  contactPhone: business.contactPhone,
  logoUrl: business.logoUrl,
  branch: business.branch,
  latitude: business.latitude,
  longitude: business.longitude,
  status: business.status,
  createdAt: business.createdAt,
  updatedAt: business.updatedAt,
});

export const onboardBusinessService = async (
  userId: string,
  body: OnboardBusinessInput,
  file?: Express.Multer.File
) => {
  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  if (!file) {
    const err = new Error("Business logo is required") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  const category = await findBusinessCategoryById(body.categoryId);
  if (!category) {
    const err = new Error("Selected business category is not available") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  const branch = branchInfoFromDetails(dbUser.branchDetails);
  if (!branch.name || branch.latitude == null || branch.longitude == null) {
    const err = new Error(
      "Please select your branch before onboarding a business"
    ) as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  const existingPending = await prisma.business.findFirst({
    where: { userId, status: "PENDING" },
  });
  if (existingPending) {
    const err = new Error(
      "You already have a pending business onboarding request"
    ) as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }

  const businessScopeId = ulid();
  const uploaded = await uploadImageBuffer(
    file.buffer,
    "businesses/logos",
    `business_${userId}_${businessScopeId}`
  );

  const created = await prisma.business.create({
    data: {
      id: businessScopeId,
      userId,
      categoryId: category.id,
      name: body.name,
      description: body.description,
      contactPhone: body.contactPhone,
      logoUrl: uploaded.url,
      branch: branch.name,
      latitude: branch.latitude,
      longitude: branch.longitude,
      status: "PENDING",
    },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  return mapBusinessForResponse(created);
};

export const getMyBusinessesService = async (userId: string) => {
  const businesses = await prisma.business.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, name: true } },
    },
  });
  return businesses.map(mapBusinessForResponse);
};

const NEARBY_BUSINESSES_RADIUS_KM = 5;

type NearbyBusinessRow = {
  id: string;
  userId: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
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

export const getApprovedBusinessWithProductsService = async (businessId: string) => {
  const business = await prisma.business.findFirst({
    where: { id: businessId, status: "APPROVED" },
    include: {
      category: { select: { id: true, name: true } },
      stores: {
        orderBy: { createdAt: "asc" },
        include: {
          products: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!business) {
    const err = new Error("Business not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  return {
    business: {
      id: business.id,
      userId: business.userId,
      name: business.name,
      description: business.description,
      category: business.category
        ? { id: business.category.id, name: business.category.name }
        : { id: business.categoryId, name: "" },
      contactPhone: business.contactPhone,
      logoUrl: business.logoUrl,
      branch: business.branch,
      latitude: business.latitude,
      longitude: business.longitude,
      status: business.status,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
    },
    stores: business.stores.map((store) => ({
      id: store.id,
      name: store.name,
      description: store.description,
      openTime: store.openTime,
      closeTime: store.closeTime,
      products: store.products.map((p) => ({
        id: p.id,
        storeId: p.storeId,
        name: p.name,
        description: p.description,
        price: toNum(p.price),
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    })),
  };
};

export const getNearbyApprovedBusinessesService = async (
  userLat: number,
  userLng: number
) => {
  const rows = await prisma.$queryRaw<NearbyBusinessRow[]>`
    SELECT * FROM (
      SELECT
        b.id,
        b."userId",
        b.name,
        b.description,
        b."categoryId",
        bc.name AS "categoryName",
        b."contactPhone",
        b."logoUrl",
        b.branch,
        b.latitude,
        b.longitude,
        b.status,
        b."createdAt",
        b."updatedAt",
        (
          6371 * acos(
            LEAST(1::double precision, GREATEST(-1::double precision,
              cos(radians(${userLat})) * cos(radians(b.latitude)) * cos(radians(b.longitude) - radians(${userLng}))
              + sin(radians(${userLat})) * sin(radians(b.latitude))
            ))
          )
        ) AS distance_km
      FROM business b
      JOIN business_category bc ON bc.id = b."categoryId"
      WHERE b.status = 'APPROVED'
        AND b.latitude IS NOT NULL
        AND b.longitude IS NOT NULL
    ) sub
    WHERE sub.distance_km <= ${NEARBY_BUSINESSES_RADIUS_KM}
    ORDER BY sub.distance_km ASC
  `;

  return {
    userLocation: { latitude: userLat, longitude: userLng },
    radiusKm: NEARBY_BUSINESSES_RADIUS_KM,
    businesses: rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      name: row.name,
      description: row.description,
      category: { id: row.categoryId, name: row.categoryName },
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
