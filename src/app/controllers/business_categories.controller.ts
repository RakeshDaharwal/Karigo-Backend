import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import { getActiveBusinessCategories } from "../../repositories/business_category.repository";

export const getBusinessCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getActiveBusinessCategories();

    logInfo("Business categories listed (app)", {
      service: "business_categories",
      event: "APP_LIST_BUSINESS_CATEGORIES_SUCCESS",
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Business categories fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("List business categories failed (app)", {
      service: "business_categories",
      event: "APP_LIST_BUSINESS_CATEGORIES_FAILED",
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};
