import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  createBusinessCategoryService,
  deleteBusinessCategoryService,
  getBusinessCategoriesService,
  updateBusinessCategoryService,
} from "../services/business_categories.service";
import {
  businessCategoryIdSchema,
  CreateBusinessCategoryInput,
  UpdateBusinessCategoryInput,
} from "../validation/business_categories.validation";

export const listBusinessCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getBusinessCategoriesService();

    logInfo("Business categories listed successfully", {
      service: "business_categories",
      event: "LIST_BUSINESS_CATEGORIES_SUCCESS",
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Business categories fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("List business categories failed", {
      service: "business_categories",
      event: "LIST_BUSINESS_CATEGORIES_FAILED",
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const createBusinessCategory = async (
  req: Request<{}, {}, CreateBusinessCategoryInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.body;
    const data = await createBusinessCategoryService(name);

    logInfo("Business category created", {
      service: "business_categories",
      event: "CREATE_BUSINESS_CATEGORY_SUCCESS",
      name,
      path: req.path,
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Business category created successfully",
      data,
    });
  } catch (error: any) {
    logError("Business category creation failed", {
      service: "business_categories",
      event: "CREATE_BUSINESS_CATEGORY_FAILED",
      name: req.body?.name,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const updateBusinessCategory = async (
  req: Request<{ id: string }, {}, UpdateBusinessCategoryInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedId = businessCategoryIdSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      const err = new Error(parsedId.error.issues[0].message) as Error & {
        statusCode: number;
      };
      err.statusCode = 400;
      throw err;
    }

    const id = parsedId.data.id;
    const { name } = req.body;
    const data = await updateBusinessCategoryService(id, name);

    logInfo("Business category updated", {
      service: "business_categories",
      event: "UPDATE_BUSINESS_CATEGORY_SUCCESS",
      id,
      name,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Business category updated successfully",
      data,
    });
  } catch (error: any) {
    logError("Business category update failed", {
      service: "business_categories",
      event: "UPDATE_BUSINESS_CATEGORY_FAILED",
      id: req.params?.id,
      name: req.body?.name,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const deleteBusinessCategory = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedId = businessCategoryIdSchema.safeParse({ id: req.params.id });
    if (!parsedId.success) {
      const err = new Error(parsedId.error.issues[0].message) as Error & {
        statusCode: number;
      };
      err.statusCode = 400;
      throw err;
    }

    const id = parsedId.data.id;
    const data = await deleteBusinessCategoryService(id);

    logInfo("Business category deleted", {
      service: "business_categories",
      event: "DELETE_BUSINESS_CATEGORY_SUCCESS",
      id,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Business category deleted successfully",
      data,
    });
  } catch (error: any) {
    logError("Business category delete failed", {
      service: "business_categories",
      event: "DELETE_BUSINESS_CATEGORY_FAILED",
      id: req.params?.id,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};
