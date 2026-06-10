import { ulid } from "ulid";
import {
  countBusinessesByCategoryId,
  createBusinessCategory,
  findBusinessCategoryById,
  findBusinessCategoryByName,
  findBusinessCategoryByNameExcludingId,
  getActiveBusinessCategories,
  reorderBusinessCategories,
  softDeleteBusinessCategoryById,
  updateBusinessCategoryById,
} from "../../repositories/business_category.repository";
import { uploadBusinessCategoryIcon } from "../../utils/cloudinary.utils";

export const getBusinessCategoriesService = async () => {
  return getActiveBusinessCategories();
};

export const createBusinessCategoryService = async (
  name: string,
  iconFile: Express.Multer.File
) => {
  const existing = await findBusinessCategoryByName(name);

  if (existing) {
    const error = new Error("Business category already exists") as Error & {
      statusCode: number;
    };
    error.statusCode = 409;
    throw error;
  }

  const categoryId = ulid();

  try {
    const uploaded = await uploadBusinessCategoryIcon(categoryId, iconFile);
    return await createBusinessCategory(categoryId, name, uploaded.url);
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

export const updateBusinessCategoryService = async (
  id: string,
  name: string,
  iconFile?: Express.Multer.File
) => {
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
    let iconUrl: string | undefined;
    if (iconFile) {
      const uploaded = await uploadBusinessCategoryIcon(id, iconFile);
      iconUrl = uploaded.url;
    }

    return await updateBusinessCategoryById(id, name, iconUrl);
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

export const reorderBusinessCategoriesService = async (orderedIds: string[]) => {
  const uniqueIds = new Set(orderedIds);
  if (uniqueIds.size !== orderedIds.length) {
    const error = new Error("Duplicate business category ids are not allowed") as Error & {
      statusCode: number;
    };
    error.statusCode = 400;
    throw error;
  }

  const categories = await getActiveBusinessCategories();
  const activeIds = new Set(categories.map((c) => c.id));

  if (orderedIds.length !== categories.length) {
    const error = new Error(
      "Ordered ids must include every active business category exactly once"
    ) as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }

  for (const id of orderedIds) {
    if (!activeIds.has(id)) {
      const error = new Error("One or more business category ids are invalid") as Error & {
        statusCode: number;
      };
      error.statusCode = 400;
      throw error;
    }
  }

  await reorderBusinessCategories(orderedIds);
  return getActiveBusinessCategories();
};
