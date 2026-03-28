import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../../utils/logger.utils";
import {
  createSubCategoryService,
  getSubCategoriesByCategoryIdService,
} from "../services/subcategories.service";
import { CreateSubCategoryInput } from "../validation/subcategories.validation";

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
