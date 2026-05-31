import {
  findCategoryById,
  getActiveCategories,
} from "../../repositories/category.repository";
import { findSubCategoriesByCategoryId } from "../../repositories/subcategory.repository";

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
