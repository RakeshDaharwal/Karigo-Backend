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

const nextBusinessCategorySortOrder = async () => {
  const { _max } = await prisma.businessCategory.aggregate({
    where: { deletedAt: null },
    _max: { sortOrder: true },
  });
  return (_max.sortOrder ?? -1) + 1;
};

export const createBusinessCategory = async (
  id: string,
  name: string,
  iconUrl: string
) => {
  const sortOrder = await nextBusinessCategorySortOrder();
  return prisma.businessCategory.create({
    data: {
      id,
      name,
      iconUrl,
      sortOrder,
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

export const updateBusinessCategoryById = (
  id: string,
  name: string,
  iconUrl?: string
) => {
  return prisma.businessCategory.update({
    where: {
      id,
    },
    data: {
      name,
      ...(iconUrl !== undefined ? { iconUrl } : {}),
    },
  });
};

export const getActiveBusinessCategories = () => {
  return prisma.businessCategory.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      sortOrder: "asc",
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

export const reorderBusinessCategories = (orderedIds: string[]) => {
  return prisma.$transaction([
    ...orderedIds.map((id, index) =>
      prisma.businessCategory.update({
        where: { id },
        data: { sortOrder: -(index + 1) },
      })
    ),
    ...orderedIds.map((id, index) =>
      prisma.businessCategory.update({
        where: { id },
        data: { sortOrder: index },
      })
    ),
  ]);
};

export const countBusinessesByCategoryId = (categoryId: string) => {
  return prisma.business.count({
    where: {
      categoryId,
    },
  });
};
