import prisma from "../config/db.conn";

export const findSubCategoryByNameAndCategoryId = (
  categoryId: string,
  name: string
) => {
  return prisma.subCategory.findFirst({
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

export const createSubCategory = (id: string, categoryId: string, name: string) => {
  return prisma.subCategory.create({
    data: {
      id,
      categoryId,
      name,
    },
  });
};

export const findSubCategoriesByCategoryId = (categoryId: string) => {
  return prisma.subCategory.findMany({
    where: {
      categoryId,
      deletedAt: null,
    },
    orderBy: {
      name: "asc",
    },
  });
};
