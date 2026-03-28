import express from "express";
import { validate } from "../../../middlewares/validate.middleware";
import {
  verifyToken,
} from "../../../middlewares/auth.middleware";
import { uploadProfileImage } from "../../../middlewares/upload.middleware";
import { editProfile } from "../controllers/user.controller";
import { uploadProfileSchema } from "../validation/user.validation";


const router = express.Router();

router.put(
  "/edit/profile",
  verifyToken,
  uploadProfileImage,
  validate(uploadProfileSchema, "UPDATE_PROFILE_VALIDATION_FAILED", "users"),
  editProfile
);

export default router;