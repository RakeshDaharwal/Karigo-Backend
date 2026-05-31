import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  getCategoriesService,
  getSubCategoriesByCategoryIdService,
} from "../services/categories.service";

export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await getCategoriesService();

    logInfo("Categories fetched successfully", {
      service: "categories",
      event: "GET_CATEGORIES_SUCCESS",
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error: any) {
    logError("Get categories failed", {
      service: "categories",
      event: "GET_CATEGORIES_FAILED",
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const getSubCategoriesByCategoryId = async (
  req: Request<{ categoryId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryId = req.params.categoryId?.trim();
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Category id is required",
      });
    }

    const data = await getSubCategoriesByCategoryIdService(categoryId);

    logInfo("Subcategories by category fetched", {
      service: "categories",
      event: "GET_SUBCATEGORIES_BY_CATEGORY",
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
    logError("Get subcategories by category failed", {
      service: "categories",
      event: "GET_SUBCATEGORIES_BY_CATEGORY_FAILED",
      categoryId: req.params?.categoryId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};
