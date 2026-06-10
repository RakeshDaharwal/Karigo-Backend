import { ulid } from "ulid";
import {
  createCategory,
  findCategoryById,
  findCategoryByName,
  findCategoryByNameExcludingId,
  getActiveCategories,
  reorderCategories,
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

export const updateCategoryService = async (
  id: string,
  name: string,
  iconFile?: Express.Multer.File
) => {
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
    let iconUrl: string | undefined;
    if (iconFile) {
      const uploaded = await uploadWorkerCategoryIcon(id, iconFile);
      iconUrl = uploaded.url;
    }

    return await updateCategoryById(id, name, iconUrl);
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

export const reorderCategoriesService = async (orderedIds: string[]) => {
  const uniqueIds = new Set(orderedIds);
  if (uniqueIds.size !== orderedIds.length) {
    const error = new Error("Duplicate category ids are not allowed") as Error & {
      statusCode: number;
    };
    error.statusCode = 400;
    throw error;
  }

  const categories = await getActiveCategories();
  const activeIds = new Set(categories.map((c) => c.id));

  if (orderedIds.length !== categories.length) {
    const error = new Error(
      "Ordered ids must include every active category exactly once"
    ) as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }

  for (const id of orderedIds) {
    if (!activeIds.has(id)) {
      const error = new Error("One or more category ids are invalid") as Error & {
        statusCode: number;
      };
      error.statusCode = 400;
      throw error;
    }
  }

  await reorderCategories(orderedIds);
  return getActiveCategories();
};
