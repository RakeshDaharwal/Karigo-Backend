import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { verifyToken } from "../../middlewares/auth.middleware";
import { uploadPropertyPhoto } from "../../middlewares/upload.middleware";
import {
  getMyHouses,
  getNearbyHouses,
  listHouse,
} from "../controllers/houses.controller";
import {
  listHouseSchema,
  nearbyListingsBodySchema,
} from "../validation/houses.validation";

const router = express.Router();

router.get("/me", verifyToken, getMyHouses);

router.post(
  "/nearby",
  verifyToken,
  validate(nearbyListingsBodySchema, "NEARBY_HOUSES_VALIDATION_FAILED", "houses"),
  getNearbyHouses
);

router.post(
  "/list",
  verifyToken,
  uploadPropertyPhoto,
  validate(listHouseSchema, "LIST_HOUSE_VALIDATION_FAILED", "houses"),
  listHouse
);

export default router;
