import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  createSubCategoryService,
  deleteSubCategoryService,
  getSubCategoriesByCategoryIdService,
  reorderSubCategoriesService,
  updateSubCategoryService,
} from "../services/subcategories.service";
import {
  categoryIdParamSchema,
  CreateSubCategoryInput,
  ReorderSubCategoriesInput,
  subCategoryIdSchema,
  UpdateSubCategoryInput,
} from "../validation/subcategories.validation";

export const listSubCategoriesByCategoryId = async (
  req: Request<{ categoryId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedCategoryId = categoryIdParamSchema.safeParse({
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
      service: "subcategories",
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
      service: "subcategories",
      event: "LIST_SUBCATEGORIES_BY_CATEGORY_FAILED",
      categoryId: req.params?.categoryId,
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
    const subCategory = await createSubCategoryService(
      categoryId,
      name,
      req.file!
    );

    logInfo("Subcategory created successfully", {
      service: "subcategories",
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
      service: "subcategories",
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
    const subCategory = await updateSubCategoryService(
      subCategoryId,
      name,
      req.file
    );

    logInfo("Subcategory updated successfully", {
      service: "subcategories",
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
      service: "subcategories",
      event: "UPDATE_SUBCATEGORY_FAILED",
      subCategoryId: req.params?.id,
      name: req.body?.name,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const reorderSubCategories = async (
  req: Request<object, object, ReorderSubCategoriesInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId, orderedIds } = req.body;
    const data = await reorderSubCategoriesService(categoryId, orderedIds);

    logInfo("Subcategories reordered successfully", {
      service: "subcategories",
      event: "REORDER_SUBCATEGORIES_SUCCESS",
      categoryId,
      count: orderedIds.length,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Subcategories reordered successfully",
      data,
    });
  } catch (error: any) {
    logError("Subcategory reorder failed", {
      service: "subcategories",
      event: "REORDER_SUBCATEGORIES_FAILED",
      categoryId: req.body?.categoryId,
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
      service: "subcategories",
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
      service: "subcategories",
      event: "DELETE_SUBCATEGORY_FAILED",
      subCategoryId: req.params?.id,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};
