import {
  createCategory,
  findCategoryById,
  findCategoryByName,
  findCategoryByNameExcludingId,
  getActiveCategories,
  softDeleteCategoryById,
  updateCategoryById,
} from "../repository/repository";

export const createCategoryService = async (name: string) => {
  const existingCategory = await findCategoryByName(name);

  if (existingCategory) {
    const error = new Error("Category already exists") as Error & { statusCode: number };
    error.statusCode = 409;
    throw error;
  }

  try {
    return await createCategory(name);
  } catch (error: any) {
    if (error?.code === "P2002") {
      const customError = new Error("Category already exists") as Error & {
        statusCode: number;
      };
      customError.statusCode = 409;
      throw customError;
    }

    throw error;
  }
};

export const updateCategoryService = async (id: number, name: string) => {
  const existingCategory = await findCategoryById(id);

  if (!existingCategory) {
    const error = new Error("Category not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const duplicateCategory = await findCategoryByNameExcludingId(name, id);

  if (duplicateCategory) {
    const error = new Error("Category already exists") as Error & { statusCode: number };
    error.statusCode = 409;
    throw error;
  }

  try {
    return await updateCategoryById(id, name);
  } catch (error: any) {
    if (error?.code === "P2002") {
      const customError = new Error("Category already exists") as Error & {
        statusCode: number;
      };
      customError.statusCode = 409;
      throw customError;
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
    const error = new Error("Category not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return softDeleteCategoryById(id);
};
