import express from "express";
import { validate } from "../../../middlewares/validate.middleware";
import {
  verifyToken,
} from "../../../middlewares/auth.middleware";
import { uploadProfileImage } from "../../../middlewares/upload.middleware";
import { updateProfile } from "../controllers/user.controller";
import { updateProfileSchema } from "../validation/user.validation";


const router = express.Router();

router.put(
  "/edit/profile",
  verifyToken,
  uploadProfileImage,
  validate(updateProfileSchema, "UPDATE_PROFILE_VALIDATION_FAILED", "users"),
  updateProfile
);

export default router;