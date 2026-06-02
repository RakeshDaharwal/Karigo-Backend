import prisma from "../config/db.conn";

export type WorkerStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ListWorkersFilters = {
  status: WorkerStatus;
  search?: string;
};

const buildWhere = (filters: ListWorkersFilters) => {
  const where: Record<string, unknown> = {
    status: filters.status,
  };

  const term = filters.search?.trim();
  if (term) {
    where.OR = [
      { firstName: { contains: term, mode: "insensitive" } },
      { lastName: { contains: term, mode: "insensitive" } },
      { branch: { contains: term, mode: "insensitive" } },
      { mobile: { contains: term } },
    ];
  }

  return where;
};

export const listWorkersByFilters = (filters: ListWorkersFilters) => {
  return prisma.worker.findMany({
    where: buildWhere(filters),
    include: {
      category: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const countWorkerStatuses = async () => {
  const [approved, pending, rejected] = await Promise.all([
    prisma.worker.count({ where: { status: "APPROVED" } }),
    prisma.worker.count({ where: { status: "PENDING" } }),
    prisma.worker.count({ where: { status: "REJECTED" } }),
  ]);
  return { approved, pending, rejected };
};

export const findWorkerByIdDetailed = (id: string) => {
  return prisma.worker.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      user: {
        select: {
          id: true,
          mobile: true,
          firstName: true,
          lastName: true,
          gender: true,
          profileImage: true,
          createdAt: true,
        },
      },
    },
  });
};

export const findSubCategoriesByIds = (ids: string[]) => {
  if (!ids.length) return Promise.resolve([]);
  return prisma.subCategory.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
};
