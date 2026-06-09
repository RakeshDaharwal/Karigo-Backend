import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  createCategoryService,
  deleteCategoryService,
  getCategoriesService,
  updateCategoryService,
} from "../services/categories.service";
import {
  categoryIdSchema,
  CreateCategoryInput,
  UpdateCategoryInput,
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

export const createCategory = async (
  req: Request<{}, {}, CreateCategoryInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.body;

    const category = await createCategoryService(name, req.file!);

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
