import express from "express";
import { validate } from "../../../middlewares/validate.middleware";
import { requireSuperAdmin } from "../../../middlewares/auth.middleware";
import { createSubCategory } from "../controllers/subcategories.controller";
import { createSubCategorySchema } from "../validation/subcategories.validation";

const router = express.Router();

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
