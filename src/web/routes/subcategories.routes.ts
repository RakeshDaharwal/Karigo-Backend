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
  reorderSubCategories,
  updateSubCategory,
} from "../controllers/subcategories.controller";
import {
  createSubCategorySchema,
  reorderSubCategoriesSchema,
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
  uploadSubCategoryIcon,
  validate(
    updateSubCategorySchema,
    "UPDATE_SUBCATEGORY_VALIDATION_FAILED",
    "subcategories"
  ),
  updateSubCategory
);

router.put(
  "/reorder",
  categoriesRateLimit,
  requireSuperAdmin,
  validate(
    reorderSubCategoriesSchema,
    "REORDER_SUBCATEGORIES_VALIDATION_FAILED",
    "subcategories"
  ),
  reorderSubCategories
);

router.delete(
  "/delete/:id",
  categoriesRateLimit,
  requireSuperAdmin,
  deleteSubCategory
);

export default router;
