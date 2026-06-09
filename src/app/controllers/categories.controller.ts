import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import { getCategoriesService } from "../services/categories.service";

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
