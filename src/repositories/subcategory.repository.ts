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

const nextSubCategorySortOrder = async (categoryId: string) => {
  const { _max } = await prisma.workerSubCategory.aggregate({
    where: { categoryId, deletedAt: null },
    _max: { sortOrder: true },
  });
  return (_max.sortOrder ?? -1) + 1;
};

export const createSubCategory = async (
  id: string,
  categoryId: string,
  name: string,
  iconUrl: string
) => {
  const sortOrder = await nextSubCategorySortOrder(categoryId);
  return prisma.workerSubCategory.create({
    data: {
      id,
      categoryId,
      name,
      iconUrl,
      sortOrder,
    },
  });
};

export const updateSubCategoryById = (
  id: string,
  name: string,
  iconUrl?: string
) => {
  return prisma.workerSubCategory.update({
    where: { id },
    data: {
      name,
      ...(iconUrl !== undefined ? { iconUrl } : {}),
    },
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
      sortOrder: "asc",
    },
  });
};

export const reorderSubCategories = (orderedIds: string[]) => {
  return prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.workerSubCategory.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );
};
