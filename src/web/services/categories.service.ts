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
import { uploadWorkerCategoryIcon } from "../../utils/cloudinary.utils";

export const getCategoriesService = async () => {
  return getActiveCategories();
};

export const createCategoryService = async (
  name: string,
  iconFile: Express.Multer.File
) => {
  const existingCategory = await findCategoryByName(name);

  if (existingCategory) {
    const error = new Error("Category already exists") as Error & { statusCode: number };
    error.statusCode = 409;
    throw error;
  }

  const categoryId = ulid();

  try {
    const uploaded = await uploadWorkerCategoryIcon(categoryId, iconFile);
    return await createCategory(categoryId, name, uploaded.url);
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
