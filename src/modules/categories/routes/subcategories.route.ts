import express from "express";
import { validate } from "../../../middlewares/validate.middleware";
import { requireSuperAdmin, verifyToken } from "../../../middlewares/auth.middleware";
import {
  createSubCategory,
  getSubCategoriesByCategoryId,
} from "../controllers/subcategories.controller";
import { createSubCategorySchema } from "../validation/subcategories.validation";

const router = express.Router();

router.get("/by-category/:categoryId", verifyToken, getSubCategoriesByCategoryId);

router.post(
  "/create",
  requireSuperAdmin,
  validate(
    createSubCategorySchema,
    "CREATE_SUBCATEGORY_VALIDATION_FAILED",
    "categories"
  ),
  createSubCategory
);

export default router;
