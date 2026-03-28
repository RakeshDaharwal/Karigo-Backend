import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../../utils/logger.utils";
import { createSubCategoryService } from "../services/subcategories.service";
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
