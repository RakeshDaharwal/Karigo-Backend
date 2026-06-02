import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { requireSuperAdmin } from "../../middlewares/auth.middleware";
import {
  getBusinessDetails,
  getBusinessStats,
  listBusinesses,
  reviewBusinessRequest,
} from "../controllers/business.controller";
import { reviewBusinessRequestSchema } from "../validation/business.validation";

const router = express.Router();

router.get("/stats", requireSuperAdmin, getBusinessStats);
router.get("/list", requireSuperAdmin, listBusinesses);
router.get("/:businessId", requireSuperAdmin, getBusinessDetails);

router.patch(
  "/:businessId/review",
  requireSuperAdmin,
  validate(
    reviewBusinessRequestSchema,
    "REVIEW_BUSINESS_REQUEST_VALIDATION_FAILED",
    "business"
  ),
  reviewBusinessRequest
);

export default router;
