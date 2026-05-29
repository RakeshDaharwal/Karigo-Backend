import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  createCategoryService,
  createSubCategoryService,
  deleteCategoryService,
  deleteSubCategoryService,
  getCategoriesService,
  getSubCategoriesByCategoryIdService,
  updateCategoryService,
  updateSubCategoryService,
} from "../services/categories.service";
import {
  categoryIdSchema,
  CreateCategoryInput,
  CreateSubCategoryInput,
  subCategoryIdSchema,
  UpdateCategoryInput,
  UpdateSubCategoryInput,
} from "../validation/categories.validation";

export const listCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await getCategoriesService();

    logInfo("Categories listed successfully", {
      service: "categories",
      event: "LIST_CATEGORIES_SUCCESS",
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error: any) {
    logError("List categories failed", {
      service: "categories",
      event: "LIST_CATEGORIES_FAILED",
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const listSubCategoriesByCategoryId = async (
  req: Request<{ categoryId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedCategoryId = categoryIdSchema.safeParse({
      id: req.params.categoryId,
    });
    if (!parsedCategoryId.success) {
      const error = new Error(parsedCategoryId.error.issues[0].message) as Error & {
        statusCode: number;
      };
      error.statusCode = 400;
      throw error;
    }

    const categoryId = parsedCategoryId.data.id;
    const data = await getSubCategoriesByCategoryIdService(categoryId);

    logInfo("Subcategories by category listed", {
      service: "categories",
      event: "LIST_SUBCATEGORIES_BY_CATEGORY_SUCCESS",
      categoryId,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Subcategories fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("List subcategories by category failed", {
      service: "categories",
      event: "LIST_SUBCATEGORIES_BY_CATEGORY_FAILED",
      categoryId: req.params?.categoryId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const createCategory = async (
  req: Request<{}, {}, CreateCategoryInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.body;

    const category = await createCategoryService(name);

    logInfo("Category created successfully", {
      service: "categories",
      event: "CREATE_CATEGORY_SUCCESS",
      name,
      path: req.path,
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Category created successfully",
      data: category,
    });
  } catch (error: any) {
    logError("Category creation failed", {
      service: "categories",
      event: "CREATE_CATEGORY_FAILED",
      name: req.body?.name,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const updateCategory = async (
  req: Request<{ id: string }, {}, UpdateCategoryInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedCategoryId = categoryIdSchema.safeParse({ id: req.params.id });
    if (!parsedCategoryId.success) {
      const error = new Error(parsedCategoryId.error.issues[0].message) as Error & {
        statusCode: number;
      };
      error.statusCode = 400;
      throw error;
    }

    const categoryId = parsedCategoryId.data.id;
    const { name } = req.body;
    const category = await updateCategoryService(categoryId, name);

    logInfo("Category updated successfully", {
      service: "categories",
      event: "UPDATE_CATEGORY_SUCCESS",
      categoryId,
      name,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error: any) {
    logError("Category update failed", {
      service: "categories",
      event: "UPDATE_CATEGORY_FAILED",
      categoryId: req.params?.id,
      name: req.body?.name,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const deleteCategory = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedCategoryId = categoryIdSchema.safeParse({ id: req.params.id });
    if (!parsedCategoryId.success) {
      const error = new Error(parsedCategoryId.error.issues[0].message) as Error & {
        statusCode: number;
      };
      error.statusCode = 400;
      throw error;
    }

    const categoryId = parsedCategoryId.data.id;
    const category = await deleteCategoryService(categoryId);

    logInfo("Category deleted successfully", {
      service: "categories",
      event: "DELETE_CATEGORY_SUCCESS",
      categoryId,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Category deleted successfully",
      data: category,
    });
  } catch (error: any) {
    logError("Category delete failed", {
      service: "categories",
      event: "DELETE_CATEGORY_FAILED",
      categoryId: req.params?.id,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const createSubCategory = async (
  req: Request<{}, {}, CreateSubCategoryInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId, name } = req.body;
    const subCategory = await createSubCategoryService(categoryId, name);

    logInfo("Subcategory created successfully", {
      service: "categories",
      event: "CREATE_SUBCATEGORY_SUCCESS",
      categoryId,
      name,
      path: req.path,
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Subcategory created successfully",
      data: subCategory,
    });
  } catch (error: any) {
    logError("Subcategory creation failed", {
      service: "categories",
      event: "CREATE_SUBCATEGORY_FAILED",
      categoryId: req.body?.categoryId,
      name: req.body?.name,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const updateSubCategory = async (
  req: Request<{ id: string }, {}, UpdateSubCategoryInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedId = subCategoryIdSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      const error = new Error(parsedId.error.issues[0].message) as Error & {
        statusCode: number;
      };
      error.statusCode = 400;
      throw error;
    }

    const subCategoryId = parsedId.data.id;
    const { name } = req.body;
    const subCategory = await updateSubCategoryService(subCategoryId, name);

    logInfo("Subcategory updated successfully", {
      service: "categories",
      event: "UPDATE_SUBCATEGORY_SUCCESS",
      subCategoryId,
      name,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Subcategory updated successfully",
      data: subCategory,
    });
  } catch (error: any) {
    logError("Subcategory update failed", {
      service: "categories",
      event: "UPDATE_SUBCATEGORY_FAILED",
      subCategoryId: req.params?.id,
      name: req.body?.name,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const deleteSubCategory = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedId = subCategoryIdSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      const error = new Error(parsedId.error.issues[0].message) as Error & {
        statusCode: number;
      };
      error.statusCode = 400;
      throw error;
    }

    const subCategoryId = parsedId.data.id;
    const subCategory = await deleteSubCategoryService(subCategoryId);

    logInfo("Subcategory deleted successfully", {
      service: "categories",
      event: "DELETE_SUBCATEGORY_SUCCESS",
      subCategoryId,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Subcategory deleted successfully",
      data: subCategory,
    });
  } catch (error: any) {
    logError("Subcategory delete failed", {
      service: "categories",
      event: "DELETE_SUBCATEGORY_FAILED",
      subCategoryId: req.params?.id,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};
