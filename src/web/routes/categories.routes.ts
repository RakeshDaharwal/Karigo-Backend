import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { requireSuperAdmin } from "../../middlewares/auth.middleware";
import {
  requireCategoryIcon,
  uploadCategoryIcon,
} from "../../middlewares/upload.middleware";
import { categoriesRateLimit } from "../../middlewares/rateLimit/redis.limits";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/categories.controller";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validation/categories.validation";

const router = express.Router();

router.get("/all", categoriesRateLimit, requireSuperAdmin, listCategories);

router.post(
  "/create",
  categoriesRateLimit,
  requireSuperAdmin,
  uploadCategoryIcon,
  requireCategoryIcon,
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

export default router;
