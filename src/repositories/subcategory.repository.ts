import prisma from "../config/db.conn";

export const findSubCategoryByNameAndCategoryId = (
  categoryId: string,
  name: string
) => {
  return prisma.workerSubCategory.findFirst({
    where: {
      categoryId,
      name: {
        equals: name,
        mode: "insensitive",
      },
      deletedAt: null,
    },
  });
};

export const findSubCategoryByNameAndCategoryIdExcludingId = (
  categoryId: string,
  name: string,
  id: string
) => {
  return prisma.workerSubCategory.findFirst({
    where: {
      categoryId,
      name: {
        equals: name,
        mode: "insensitive",
      },
      deletedAt: null,
      NOT: { id },
    },
  });
};

export const findSubCategoryById = (id: string) => {
  return prisma.workerSubCategory.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });
};

export const createSubCategory = (id: string, categoryId: string, name: string) => {
  return prisma.workerSubCategory.create({
    data: {
      id,
      categoryId,
      name,
    },
  });
};

export const updateSubCategoryById = (id: string, name: string) => {
  return prisma.workerSubCategory.update({
    where: { id },
    data: { name },
  });
};

export const softDeleteSubCategoryById = (id: string) => {
  return prisma.workerSubCategory.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

export const findSubCategoriesByCategoryId = (categoryId: string) => {
  return prisma.workerSubCategory.findMany({
    where: {
      categoryId,
      deletedAt: null,
    },
    orderBy: {
      name: "asc",
    },
  });
};
