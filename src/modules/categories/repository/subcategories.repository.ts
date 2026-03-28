import prisma from "../../../config/db.conn";

export const findSubCategoryByNameAndCategoryId = (
  categoryId: number,
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

export const createSubCategory = (categoryId: number, name: string) => {
  return prisma.subCategory.create({
    data: {
      categoryId,
      name,
    },
  });
};
