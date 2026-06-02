import prisma from "../config/db.conn";

export const findBusinessCategoryByName = (name: string) => {
  return prisma.businessCategory.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
      deletedAt: null,
    },
  });
};

export const createBusinessCategory = (id: string, name: string) => {
  return prisma.businessCategory.create({
    data: {
      id,
      name,
    },
  });
};

export const findBusinessCategoryById = (id: string) => {
  return prisma.businessCategory.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });
};

export const findBusinessCategoryByNameExcludingId = (
  name: string,
  id: string
) => {
  return prisma.businessCategory.findFirst({
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

export const updateBusinessCategoryById = (id: string, name: string) => {
  return prisma.businessCategory.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });
};

export const getActiveBusinessCategories = () => {
  return prisma.businessCategory.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const softDeleteBusinessCategoryById = (id: string) => {
  return prisma.businessCategory.update({
    where: {
      id,
    },
    data: {
      deletedAt: new Date(),
    },
  });
};

export const countBusinessesByCategoryId = (categoryId: string) => {
  return prisma.business.count({
    where: {
      categoryId,
    },
  });
};
