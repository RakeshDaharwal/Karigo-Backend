import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { requireSuperAdmin } from "../../middlewares/auth.middleware";
import {
  getShopDetails,
  getShopStats,
  listShops,
  reviewShopRequest,
} from "../controllers/shop.controller";
import { reviewShopRequestSchema } from "../validation/shop.validation";

const router = express.Router();

router.get("/stats", requireSuperAdmin, getShopStats);
router.get("/list", requireSuperAdmin, listShops);
router.get("/:shopId", requireSuperAdmin, getShopDetails);

router.patch(
  "/:shopId/review",
  requireSuperAdmin,
  validate(reviewShopRequestSchema, "REVIEW_SHOP_REQUEST_VALIDATION_FAILED", "shop"),
  reviewShopRequest
);

export default router;
