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

export const createCategory = (id: string, name: string) => {
  return prisma.workerCategory.create({
    data: {
      id,
      name,
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
      createdAt: "desc",
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
