import prisma from "../../config/db.conn";
import { ShopCategory } from "../../generated/prisma/enums";
import {
  countShopStatuses,
  findShopByIdDetailed,
  listShopsByFilters,
  ShopStatus,
} from "../../repositories/shop.repository";

export const getShopStatsService = async () => {
  return countShopStatuses();
};

export const listShopsService = async (params: {
  status: ShopStatus;
  category?: ShopCategory;
  search?: string;
}) => {
  const shops = await listShopsByFilters(params);

  return shops.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    category: s.category,
    contactPhone: s.contactPhone,
    logoUrl: s.logoUrl,
    status: s.status,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    owner: {
      id: s.user.id,
      mobile: s.user.mobile,
      firstName: s.user.firstName,
      lastName: s.user.lastName,
      fullName:
        [s.user.firstName, s.user.lastName].filter(Boolean).join(" ").trim() ||
        null,
    },
  }));
};

export const getShopDetailsService = async (shopId: string) => {
  const shop = await findShopByIdDetailed(shopId);

  if (!shop) {
    const err = new Error("Shop not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  return {
    id: shop.id,
    name: shop.name,
    description: shop.description,
    category: shop.category,
    contactPhone: shop.contactPhone,
    logoUrl: shop.logoUrl,
    status: shop.status,
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
    owner: {
      id: shop.user.id,
      mobile: shop.user.mobile,
      firstName: shop.user.firstName,
      lastName: shop.user.lastName,
      fullName:
        [shop.user.firstName, shop.user.lastName].filter(Boolean).join(" ").trim() ||
        null,
      profileImage: shop.user.profileImage,
      createdAt: shop.user.createdAt,
    },
  };
};

export const reviewShopRequestService = async (
  shopId: string,
  decision: "APPROVED" | "REJECT"
) => {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });

  if (!shop) {
    const err = new Error("Shop not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  if (shop.status !== "PENDING") {
    const err = new Error("Shop is not pending review") as Error & {
      statusCode: number;
    };
    err.statusCode = 400;
    throw err;
  }

  const nextStatus = decision === "REJECT" ? "REJECTED" : "APPROVED";

  return prisma.shop.update({
    where: { id: shopId },
    data: { status: nextStatus },
    include: {
      user: {
        select: {
          id: true,
          mobile: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};
