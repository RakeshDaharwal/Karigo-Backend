import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createAddress,
  deleteAddress,
  listAddresses,
} from "../controllers/addresses.controller";
import { createAddressSchema } from "../validation/addresses.validation";

const router = express.Router();

router.get("/", verifyToken, listAddresses);

router.post(
  "/",
  verifyToken,
  validate(createAddressSchema, "CREATE_ADDRESS_VALIDATION_FAILED", "addresses"),
  createAddress
);

router.delete("/:id", verifyToken, deleteAddress);

export default router;
