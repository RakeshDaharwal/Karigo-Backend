import { ulid } from "ulid";
import {
  countBusinessesByCategoryId,
  createBusinessCategory,
  findBusinessCategoryById,
  findBusinessCategoryByName,
  findBusinessCategoryByNameExcludingId,
  getActiveBusinessCategories,
  softDeleteBusinessCategoryById,
  updateBusinessCategoryById,
} from "../../repositories/business_category.repository";

export const getBusinessCategoriesService = async () => {
  return getActiveBusinessCategories();
};

export const createBusinessCategoryService = async (name: string) => {
  const existing = await findBusinessCategoryByName(name);

  if (existing) {
    const error = new Error("Business category already exists") as Error & {
      statusCode: number;
    };
    error.statusCode = 409;
    throw error;
  }

  try {
    return await createBusinessCategory(ulid(), name);
  } catch (error: any) {
    if (error?.code === "P2002") {
      const customError = new Error("Business category already exists") as Error & {
        statusCode: number;
      };
      customError.statusCode = 409;
      throw customError;
    }
    throw error;
  }
};

export const updateBusinessCategoryService = async (id: string, name: string) => {
  const existing = await findBusinessCategoryById(id);

  if (!existing) {
    const error = new Error("Business category not found") as Error & {
      statusCode: number;
    };
    error.statusCode = 404;
    throw error;
  }

  const duplicate = await findBusinessCategoryByNameExcludingId(name, id);

  if (duplicate) {
    const error = new Error("Business category already exists") as Error & {
      statusCode: number;
    };
    error.statusCode = 409;
    throw error;
  }

  try {
    return await updateBusinessCategoryById(id, name);
  } catch (error: any) {
    if (error?.code === "P2002") {
      const customError = new Error("Business category already exists") as Error & {
        statusCode: number;
      };
      customError.statusCode = 409;
      throw customError;
    }
    throw error;
  }
};

export const deleteBusinessCategoryService = async (id: string) => {
  const existing = await findBusinessCategoryById(id);

  if (!existing) {
    const error = new Error("Business category not found") as Error & {
      statusCode: number;
    };
    error.statusCode = 404;
    throw error;
  }

  // Prevent removing a category that is still referenced by businesses, otherwise
  // the FK would block the soft-delete from being meaningful for filters/lists.
  const inUse = await countBusinessesByCategoryId(id);
  if (inUse > 0) {
    const error = new Error(
      "Business category is in use by existing businesses"
    ) as Error & { statusCode: number };
    error.statusCode = 409;
    throw error;
  }

  return softDeleteBusinessCategoryById(id);
};
