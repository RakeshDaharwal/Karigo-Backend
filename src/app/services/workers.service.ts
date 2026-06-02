import prisma from "../../config/db.conn";
import { findCategoryById } from "../../repositories/category.repository";

const NEARBY_RADIUS_KM = 5;

type WorkerDistanceRow = {
  id: string;
  userId: string;
  mobile: string;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
  latitude: number | null;
  longitude: number | null;
  categoryId: string;
  subCategoryIds: string[];
  experienceYears: number | null;
  distance_km: number;
};

const toNum = (v: unknown) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  if (v && typeof v === "object" && "toNumber" in v && typeof (v as { toNumber: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return Number(v);
};

export const getApprovedWorkersByCategoryNearby = async (
  categoryId: string,
  userLat: number,
  userLng: number
) => {
  const category = await findCategoryById(categoryId);
  if (!category) {
    const err = new Error("Category not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const rows = await prisma.$queryRaw<WorkerDistanceRow[]>`
    SELECT * FROM (
      SELECT
        w.id,
        w."userId",
        w.mobile,
        w."firstName",
        w."lastName",
        w."profileImage",
        w.latitude,
        w.longitude,
        w."categoryId",
        w."subCategoryIds",
        w."experienceYears",
        (
          6371 * acos(
            LEAST(1::double precision, GREATEST(-1::double precision,
              cos(radians(${userLat})) * cos(radians(w.latitude)) * cos(radians(w.longitude) - radians(${userLng}))
              + sin(radians(${userLat})) * sin(radians(w.latitude))
            ))
          )
        ) AS distance_km
      FROM worker w
      WHERE w."categoryId" = ${categoryId}
        AND w.status = 'APPROVED'
        AND w.latitude IS NOT NULL
        AND w.longitude IS NOT NULL
    ) sub
    WHERE sub.distance_km <= ${NEARBY_RADIUS_KM}
    ORDER BY sub.distance_km ASC
  `;

  const allSubIds = [...new Set(rows.flatMap((r) => r.subCategoryIds ?? []))];
  const subCategories =
    allSubIds.length === 0
      ? []
      : await prisma.subCategory.findMany({
          where: {
            id: { in: allSubIds },
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
          },
        });

  const subById = new Map(subCategories.map((s) => [s.id, s.name]));

  const workers = rows.map((row) => {
    const names = (row.subCategoryIds ?? [])
      .map((id) => subById.get(id))
      .filter((n): n is string => Boolean(n));
    const fullName = [row.firstName, row.lastName].filter(Boolean).join(" ").trim() || null;

    return {
      id: row.id,
      userId: row.userId,
      mobile: row.mobile,
      firstName: row.firstName,
      lastName: row.lastName,
      fullName,
      profileImage: row.profileImage,
      latitude: row.latitude,
      longitude: row.longitude,
      distanceKm: Math.round(toNum(row.distance_km) * 100) / 100,
      specialization: names.length ? names.join(", ") : null,
      subCategories: (row.subCategoryIds ?? []).map((id) => ({
        id,
        name: subById.get(id) ?? null,
      })),
      rating: null,
      experienceYears: row.experienceYears,
    };
  });

  return {
    category: {
      id: category.id,
      name: category.name,
    },
    userLocation: {
      latitude: userLat,
      longitude: userLng,
    },
    radiusKm: NEARBY_RADIUS_KM,
    workers,
  };
};
