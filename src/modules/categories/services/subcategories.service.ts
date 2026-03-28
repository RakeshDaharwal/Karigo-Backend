import { findCategoryById } from "../repository/repository";
import {
  createSubCategory,
  findSubCategoryByNameAndCategoryId,
} from "../repository/subcategories.repository";

export const createSubCategoryService = async (
  categoryId: number,
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
    return await createSubCategory(categoryId, name);
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
