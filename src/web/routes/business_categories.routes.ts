import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { requireSuperAdmin } from "../../middlewares/auth.middleware";
import { categoriesRateLimit } from "../../middlewares/rateLimit/redis.limits";
import {
  createBusinessCategory,
  deleteBusinessCategory,
  listBusinessCategories,
  updateBusinessCategory,
} from "../controllers/business_categories.controller";
import {
  createBusinessCategorySchema,
  updateBusinessCategorySchema,
} from "../validation/business_categories.validation";

const router = express.Router();

router.get("/all", categoriesRateLimit, requireSuperAdmin, listBusinessCategories);

router.post(
  "/create",
  categoriesRateLimit,
  requireSuperAdmin,
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
  validate(
    updateBusinessCategorySchema,
    "UPDATE_BUSINESS_CATEGORY_VALIDATION_FAILED",
    "business_categories"
  ),
  updateBusinessCategory
);

router.delete(
  "/delete/:id",
  categoriesRateLimit,
  requireSuperAdmin,
  deleteBusinessCategory
);

export default router;
