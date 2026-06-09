import prisma from "../config/db.conn";

export const findCategoryByName = (name: string) => {
  return prisma.workerCategory.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
      deletedAt: null,
    },
  });
};

const nextCategorySortOrder = async () => {
  const { _max } = await prisma.workerCategory.aggregate({
    where: { deletedAt: null },
    _max: { sortOrder: true },
  });
  return (_max.sortOrder ?? -1) + 1;
};

export const createCategory = async (id: string, name: string, iconUrl: string) => {
  const sortOrder = await nextCategorySortOrder();
  return prisma.workerCategory.create({
    data: {
      id,
      name,
      iconUrl,
      sortOrder,
    },
  });
};

export const findCategoryById = (id: string) => {
  return prisma.workerCategory.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });
};

export const findCategoryByNameExcludingId = (name: string, id: string) => {
  return prisma.workerCategory.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
      deletedAt: null,
      NOT: {
        id,
      },
    },
  });
};

export const updateCategoryById = (id: string, name: string) => {
  return prisma.workerCategory.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });
};

export const getActiveCategories = () => {
  return prisma.workerCategory.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });
};

export const softDeleteCategoryById = (id: string) => {
  return prisma.workerCategory.update({
    where: {
      id,
    },
    data: {
      deletedAt: new Date(),
    },
  });
};
