import prisma from "../config/db.conn";
import { ShopCategory } from "../generated/prisma/enums";

export type ShopStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ListShopsFilters = {
  status: ShopStatus;
  category?: ShopCategory;
  search?: string;
};

const buildWhere = (filters: ListShopsFilters) => {
  const where: Record<string, unknown> = {
    status: filters.status,
  };

  if (filters.category) {
    where.category = filters.category;
  }

  const term = filters.search?.trim();
  if (term) {
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { contactPhone: { contains: term } },
    ];
  }

  return where;
};

export const listShopsByFilters = (filters: ListShopsFilters) => {
  return prisma.shop.findMany({
    where: buildWhere(filters),
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
    orderBy: { createdAt: "desc" },
  });
};

export const countShopStatuses = async () => {
  const [approved, pending, rejected] = await Promise.all([
    prisma.shop.count({ where: { status: "APPROVED" } }),
    prisma.shop.count({ where: { status: "PENDING" } }),
    prisma.shop.count({ where: { status: "REJECTED" } }),
  ]);
  return { approved, pending, rejected };
};

export const findShopByIdDetailed = (id: string) => {
  return prisma.shop.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          mobile: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          createdAt: true,
        },
      },
    },
  });
};

export const findApprovedShopsByUserId = (userId: string) => {
  return prisma.shop.findMany({
    where: { userId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });
};

export const countApprovedShopsByUserId = (userId: string) => {
  return prisma.shop.count({
    where: { userId, status: "APPROVED" },
  });
};
