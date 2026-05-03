import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { requireSuperAdmin } from "../../middlewares/auth.middleware";
import { categoriesRateLimit } from "../../middlewares/rateLimit/redis.limits";
import {
  createCategory,
  createSubCategory,
  deleteCategory,
  updateCategory,
} from "../controllers/categories.controller";
import {
  createCategorySchema,
  createSubCategorySchema,
  updateCategorySchema,
} from "../validation/categories.validation";

const router = express.Router();

router.post(
  "/create",
  categoriesRateLimit,
  requireSuperAdmin,
  validate(createCategorySchema, "CREATE_CATEGORY_VALIDATION_FAILED", "categories"),
  createCategory
);

router.put(
  "/edit/:id",
  categoriesRateLimit,
  requireSuperAdmin,
  validate(updateCategorySchema, "UPDATE_CATEGORY_VALIDATION_FAILED", "categories"),
  updateCategory
);

router.delete("/delete/:id", categoriesRateLimit, requireSuperAdmin, deleteCategory);

export const subcategoriesRoutes = express.Router();

subcategoriesRoutes.post(
  "/create",
  categoriesRateLimit,
  requireSuperAdmin,
  validate(
    createSubCategorySchema,
    "CREATE_SUBCATEGORY_VALIDATION_FAILED",
    "categories"
  ),
  createSubCategory
);

export default router;
