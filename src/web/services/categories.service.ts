import { ulid } from "ulid";
import {
  createCategory,
  findCategoryById,
  findCategoryByName,
  findCategoryByNameExcludingId,
  getActiveCategories,
  softDeleteCategoryById,
  updateCategoryById,
} from "../../repositories/category.repository";
import {
  createSubCategory,
  findSubCategoriesByCategoryId,
  findSubCategoryById,
  findSubCategoryByNameAndCategoryId,
  findSubCategoryByNameAndCategoryIdExcludingId,
  softDeleteSubCategoryById,
  updateSubCategoryById,
} from "../../repositories/subcategory.repository";

export const getCategoriesService = async () => {
  return getActiveCategories();
};

export const getSubCategoriesByCategoryIdService = async (categoryId: string) => {
  const category = await findCategoryById(categoryId);

  if (!category) {
    const error = new Error("Category not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return findSubCategoriesByCategoryId(categoryId);
};

export const createCategoryService = async (name: string) => {
  const existingCategory = await findCategoryByName(name);

  if (existingCategory) {
    const error = new Error("Category already exists") as Error & { statusCode: number };
    error.statusCode = 409;
    throw error;
  }

  try {
    return await createCategory(ulid(), name);
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

export const updateCategoryService = async (id: string, name: string) => {
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

export const deleteCategoryService = async (id: string) => {
  const existingCategory = await findCategoryById(id);

  if (!existingCategory) {
    const error = new Error("Category not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return softDeleteCategoryById(id);
};

export const createSubCategoryService = async (
  categoryId: string,
  name: string
) => {
  const existingCategory = await findCategoryById(categoryId);

  if (!existingCategory) {
    const error = new Error("Category not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const existingSubCategory = await findSubCategoryByNameAndCategoryId(
    categoryId,
    name
  );

  if (existingSubCategory) {
    const error = new Error("Subcategory already exists") as Error & {
      statusCode: number;
    };
    error.statusCode = 409;
    throw error;
  }

  try {
    return await createSubCategory(ulid(), categoryId, name);
  } catch (error: any) {
    if (error?.code === "P2002") {
      const customError = new Error("Subcategory already exists") as Error & {
        statusCode: number;
      };
      customError.statusCode = 409;
      throw customError;
    }

    throw error;
  }
};

export const updateSubCategoryService = async (id: string, name: string) => {
  const existingSubCategory = await findSubCategoryById(id);

  if (!existingSubCategory) {
    const error = new Error("Subcategory not found") as Error & {
      statusCode: number;
    };
    error.statusCode = 404;
    throw error;
  }

  const duplicate = await findSubCategoryByNameAndCategoryIdExcludingId(
    existingSubCategory.categoryId,
    name,
    id
  );

  if (duplicate) {
    const error = new Error("Subcategory already exists") as Error & {
      statusCode: number;
    };
    error.statusCode = 409;
    throw error;
  }

  try {
    return await updateSubCategoryById(id, name);
  } catch (error: any) {
    if (error?.code === "P2002") {
      const customError = new Error("Subcategory already exists") as Error & {
        statusCode: number;
      };
      customError.statusCode = 409;
      throw customError;
    }

    throw error;
  }
};

export const deleteSubCategoryService = async (id: string) => {
  const existingSubCategory = await findSubCategoryById(id);

  if (!existingSubCategory) {
    const error = new Error("Subcategory not found") as Error & {
      statusCode: number;
    };
    error.statusCode = 404;
    throw error;
  }

  return softDeleteSubCategoryById(id);
};
