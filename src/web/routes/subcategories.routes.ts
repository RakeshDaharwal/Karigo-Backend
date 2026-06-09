import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { requireSuperAdmin } from "../../middlewares/auth.middleware";
import {
  requireSubCategoryIcon,
  uploadSubCategoryIcon,
} from "../../middlewares/upload.middleware";
import { categoriesRateLimit } from "../../middlewares/rateLimit/redis.limits";
import {
  createSubCategory,
  deleteSubCategory,
  listSubCategoriesByCategoryId,
  updateSubCategory,
} from "../controllers/subcategories.controller";
import {
  createSubCategorySchema,
  updateSubCategorySchema,
} from "../validation/subcategories.validation";

const router = express.Router();

router.get(
  "/by-category/:categoryId",
  categoriesRateLimit,
  requireSuperAdmin,
  listSubCategoriesByCategoryId
);

router.post(
  "/create",
  categoriesRateLimit,
  requireSuperAdmin,
  uploadSubCategoryIcon,
  requireSubCategoryIcon,
  validate(
    createSubCategorySchema,
    "CREATE_SUBCATEGORY_VALIDATION_FAILED",
    "subcategories"
  ),
  createSubCategory
);

router.put(
  "/edit/:id",
  categoriesRateLimit,
  requireSuperAdmin,
  validate(
    updateSubCategorySchema,
    "UPDATE_SUBCATEGORY_VALIDATION_FAILED",
    "subcategories"
  ),
  updateSubCategory
);

router.delete(
  "/delete/:id",
  categoriesRateLimit,
  requireSuperAdmin,
  deleteSubCategory
);

export default router;
