import prisma from "../config/db.conn";
import { BusinessCategory } from "../generated/prisma/enums";

export type BusinessStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ListBusinessesFilters = {
  status: BusinessStatus;
  category?: BusinessCategory;
  search?: string;
};

const buildWhere = (filters: ListBusinessesFilters) => {
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

export const listBusinessesByFilters = (filters: ListBusinessesFilters) => {
  return prisma.business.findMany({
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

export const countBusinessStatuses = async () => {
  const [approved, pending, rejected] = await Promise.all([
    prisma.business.count({ where: { status: "APPROVED" } }),
    prisma.business.count({ where: { status: "PENDING" } }),
    prisma.business.count({ where: { status: "REJECTED" } }),
  ]);
  return { approved, pending, rejected };
};

export const findBusinessByIdDetailed = (id: string) => {
  return prisma.business.findUnique({
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

export const findApprovedBusinessesByUserId = (userId: string) => {
  return prisma.business.findMany({
    where: { userId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });
};

export const countApprovedBusinessesByUserId = (userId: string) => {
  return prisma.business.count({
    where: { userId, status: "APPROVED" },
  });
};
