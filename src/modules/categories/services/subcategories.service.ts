import { ulid } from "ulid";
import { findCategoryById } from "../repository/repository";
import {
  createSubCategory,
  findSubCategoryByNameAndCategoryId,
  findSubCategoriesByCategoryId,
} from "../repository/subcategories.repository";

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

export const getSubCategoriesByCategoryIdService = async (categoryId: string) => {
  const category = await findCategoryById(categoryId);

  if (!category) {
    const error = new Error("Category not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return findSubCategoriesByCategoryId(categoryId);
};
