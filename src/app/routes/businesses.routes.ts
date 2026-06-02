import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { verifyToken } from "../../middlewares/auth.middleware";
import { uploadBusinessLogo } from "../../middlewares/upload.middleware";
import {
  getBusinessDetails,
  getMyBusinesses,
  getNearbyBusinesses,
  onboardBusiness,
} from "../controllers/businesses.controller";
import {
  nearbyBusinessesBodySchema,
  onboardBusinessSchema,
} from "../validation/businesses.validation";

const router = express.Router();

router.get("/me", verifyToken, getMyBusinesses);

router.post(
  "/nearby",
  verifyToken,
  validate(
    nearbyBusinessesBodySchema,
    "NEARBY_BUSINESSES_VALIDATION_FAILED",
    "businesses"
  ),
  getNearbyBusinesses
);

router.post(
  "/onboard",
  verifyToken,
  uploadBusinessLogo,
  validate(
    onboardBusinessSchema,
    "ONBOARD_BUSINESS_VALIDATION_FAILED",
    "businesses"
  ),
  onboardBusiness
);

router.get("/:businessId", verifyToken, getBusinessDetails);

export default router;
