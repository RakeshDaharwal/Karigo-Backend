import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { verifyToken } from "../../middlewares/auth.middleware";
import { uploadAadhaarImage, uploadProfileImage } from "../../middlewares/upload.middleware";
import { editProfile, joinKarigoAsProfessional } from "../controllers/users.controller";
import {
  joinProfessionalSchema,
  uploadProfileSchema,
} from "../validation/user.validation";

const router = express.Router();

router.put(
  "/edit/profile",
  verifyToken,
  uploadProfileImage,
  validate(uploadProfileSchema, "UPDATE_PROFILE_VALIDATION_FAILED", "users"),
  editProfile
);

router.post(
  "/join/professional",
  verifyToken,
  uploadAadhaarImage,
  validate(joinProfessionalSchema, "JOIN_PROFESSIONAL_VALIDATION_FAILED", "users"),
  joinKarigoAsProfessional
);

export default router;
