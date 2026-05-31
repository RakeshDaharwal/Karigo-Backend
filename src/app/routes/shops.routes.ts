import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { verifyToken } from "../../middlewares/auth.middleware";
import { uploadShopLogo } from "../../middlewares/upload.middleware";
import {
  getMyShops,
  getNearbyShops,
  getShopDetails,
  onboardShop,
} from "../controllers/shops.controller";
import {
  nearbyShopsBodySchema,
  onboardShopSchema,
} from "../validation/shops.validation";

const router = express.Router();

router.get("/me", verifyToken, getMyShops);

router.post(
  "/nearby",
  verifyToken,
  validate(nearbyShopsBodySchema, "NEARBY_SHOPS_VALIDATION_FAILED", "shops"),
  getNearbyShops
);

router.post(
  "/onboard",
  verifyToken,
  uploadShopLogo,
  validate(onboardShopSchema, "ONBOARD_SHOP_VALIDATION_FAILED", "shops"),
  onboardShop
);

router.get("/:shopId", verifyToken, getShopDetails);

export default router;
