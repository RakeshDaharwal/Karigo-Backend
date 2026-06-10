import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { requireSuperAdmin } from "../../middlewares/auth.middleware";
import {
  requireCategoryIcon,
  uploadCategoryIcon,
} from "../../middlewares/upload.middleware";
import { categoriesRateLimit } from "../../middlewares/rateLimit/redis.limits";
import {
  createBusinessCategory,
  deleteBusinessCategory,
  listBusinessCategories,
  reorderBusinessCategories,
  updateBusinessCategory,
} from "../controllers/business_categories.controller";
import {
  createBusinessCategorySchema,
  reorderBusinessCategoriesSchema,
  updateBusinessCategorySchema,
} from "../validation/business_categories.validation";

const router = express.Router();

router.get("/all", categoriesRateLimit, requireSuperAdmin, listBusinessCategories);

router.post(
  "/create",
  categoriesRateLimit,
  requireSuperAdmin,
  uploadCategoryIcon,
  requireCategoryIcon,
  validate(
    createBusinessCategorySchema,
    "CREATE_BUSINESS_CATEGORY_VALIDATION_FAILED",
    "business_categories"
  ),
  createBusinessCategory
);

router.put(
  "/edit/:id",
  categoriesRateLimit,
  requireSuperAdmin,
  uploadCategoryIcon,
  validate(
    updateBusinessCategorySchema,
    "UPDATE_BUSINESS_CATEGORY_VALIDATION_FAILED",
    "business_categories"
  ),
  updateBusinessCategory
);

router.put(
  "/reorder",
  categoriesRateLimit,
  requireSuperAdmin,
  validate(
    reorderBusinessCategoriesSchema,
    "REORDER_BUSINESS_CATEGORIES_VALIDATION_FAILED",
    "business_categories"
  ),
  reorderBusinessCategories
);

router.delete(
  "/delete/:id",
  categoriesRateLimit,
  requireSuperAdmin,
  deleteBusinessCategory
);

export default router;
