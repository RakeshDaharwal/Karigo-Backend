import {
  createCategory,
  findCategoryById,
  findCategoryByName,
  findCategoryByNameExcludingId,
  getActiveCategories,
  softDeleteCategoryById,
  updateCategoryById,
} from "../repository/repository";

const createError = (message: string, statusCode: number) => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
};

export const createCategoryService = async (name: string) => {
  const existingCategory = await findCategoryByName(name);

  if (existingCategory) {
    throw createError("Category already exists", 409);
  }

  try {
    return await createCategory(name);
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw createError("Category already exists", 409);
    }

    throw error;
  }
};

export const updateCategoryService = async (id: number, name: string) => {
  const existingCategory = await findCategoryById(id);

  if (!existingCategory) {
    throw createError("Category not found", 404);
  }

  const duplicateCategory = await findCategoryByNameExcludingId(name, id);

  if (duplicateCategory) {
    throw createError("Category already exists", 409);
  }

  try {
    return await updateCategoryById(id, name);
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw createError("Category already exists", 409);
    }

    throw error;
  }
};

export const getCategoriesService = async () => {
  return getActiveCategories();
};

export const deleteCategoryService = async (id: number) => {
  const existingCategory = await findCategoryById(id);

  if (!existingCategory) {
    throw createError("Category not found", 404);
  }

  return softDeleteCategoryById(id);
};
