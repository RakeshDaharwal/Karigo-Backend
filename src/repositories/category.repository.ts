import prisma from "../config/db.conn";

export const findCategoryByName = (name: string) => {
  return prisma.category.findFirst({
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
  return prisma.category.create({
    data: {
      id,
      name,
    },
  });
};

export const findCategoryById = (id: string) => {
  return prisma.category.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });
};

export const findCategoryByNameExcludingId = (name: string, id: string) => {
  return prisma.category.findFirst({
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
  return prisma.category.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });
};

export const getActiveCategories = () => {
  return prisma.category.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const softDeleteCategoryById = (id: string) => {
  return prisma.category.update({
    where: {
      id,
    },
    data: {
      deletedAt: new Date(),
    },
  });
};
