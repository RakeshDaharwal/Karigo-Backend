import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { verifyToken } from "../../middlewares/auth.middleware";
import { uploadVehiclePhotos } from "../../middlewares/upload.middleware";
import {
  getMyVehicles,
  getNearbyVehicles,
  listVehicle,
} from "../controllers/vehicles.controller";
import {
  listVehicleSchema,
  nearbyListingsBodySchema,
} from "../validation/vehicles.validation";

const router = express.Router();

router.get("/me", verifyToken, getMyVehicles);

router.post(
  "/nearby",
  verifyToken,
  validate(
    nearbyListingsBodySchema,
    "NEARBY_VEHICLES_VALIDATION_FAILED",
    "vehicles"
  ),
  getNearbyVehicles
);

router.post(
  "/list",
  verifyToken,
  uploadVehiclePhotos,
  validate(listVehicleSchema, "LIST_VEHICLE_VALIDATION_FAILED", "vehicles"),
  listVehicle
);

export default router;
