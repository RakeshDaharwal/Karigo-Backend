import { ulid } from "ulid";
import { findCategoryById } from "../../repositories/category.repository";
import { uploadWorkerSubCategoryIcon } from "../../utils/cloudinary.utils";
import {
  createSubCategory,
  findSubCategoriesByCategoryId,
  findSubCategoryById,
  findSubCategoryByNameAndCategoryId,
  findSubCategoryByNameAndCategoryIdExcludingId,
  reorderSubCategories,
  softDeleteSubCategoryById,
  updateSubCategoryById,
} from "../../repositories/subcategory.repository";

export const getSubCategoriesByCategoryIdService = async (categoryId: string) => {
  const category = await findCategoryById(categoryId);

  if (!category) {
    const error = new Error("Category not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return findSubCategoriesByCategoryId(categoryId);
};

export const createSubCategoryService = async (
  categoryId: string,
  name: string,
  iconFile: Express.Multer.File
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

  const subCategoryId = ulid();

  try {
    const uploaded = await uploadWorkerSubCategoryIcon(
      categoryId,
      subCategoryId,
      iconFile
    );
    return await createSubCategory(
      subCategoryId,
      categoryId,
      name,
      uploaded.url
    );
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

export const updateSubCategoryService = async (
  id: string,
  name: string,
  iconFile?: Express.Multer.File
) => {
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
    let iconUrl: string | undefined;
    if (iconFile) {
      const uploaded = await uploadWorkerSubCategoryIcon(
        existingSubCategory.categoryId,
        id,
        iconFile
      );
      iconUrl = uploaded.url;
    }

    return await updateSubCategoryById(id, name, iconUrl);
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

export const reorderSubCategoriesService = async (
  categoryId: string,
  orderedIds: string[]
) => {
  const category = await findCategoryById(categoryId);

  if (!category) {
    const error = new Error("Category not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const uniqueIds = new Set(orderedIds);
  if (uniqueIds.size !== orderedIds.length) {
    const error = new Error("Duplicate subcategory ids are not allowed") as Error & {
      statusCode: number;
    };
    error.statusCode = 400;
    throw error;
  }

  const subCategories = await findSubCategoriesByCategoryId(categoryId);
  const activeIds = new Set(subCategories.map((s) => s.id));

  if (orderedIds.length !== subCategories.length) {
    const error = new Error(
      "Ordered ids must include every active subcategory exactly once"
    ) as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }

  for (const id of orderedIds) {
    if (!activeIds.has(id)) {
      const error = new Error("One or more subcategory ids are invalid") as Error & {
        statusCode: number;
      };
      error.statusCode = 400;
      throw error;
    }
  }

  await reorderSubCategories(orderedIds);
  return findSubCategoriesByCategoryId(categoryId);
};
