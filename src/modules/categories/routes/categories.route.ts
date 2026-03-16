import express from "express";
import { validate } from "../../../middlewares/validate.middleware";
import {
  requireSuperAdmin,
  verifyToken,
} from "../../../middlewares/auth.middleware";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../controllers/categories.controller";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validation/categories.validation";

const router = express.Router();

router.post(
  "/create",
  requireSuperAdmin,
  validate(
    createCategorySchema,
    "CREATE_CATEGORY_VALIDATION_FAILED",
    "categories"
  ),
  createCategory
);

router.put(
  "/edit/:id",
  requireSuperAdmin,
  validate(
    updateCategorySchema,
    "UPDATE_CATEGORY_VALIDATION_FAILED",
    "categories"
  ),
  updateCategory
);

router.get("/all", verifyToken, getCategories);

router.delete("/delete/:id", requireSuperAdmin, deleteCategory);

export default router;
