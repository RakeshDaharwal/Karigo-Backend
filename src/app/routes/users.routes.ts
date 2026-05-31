import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { verifyToken } from "../../middlewares/auth.middleware";
import { uploadAadhaarImage, uploadProfileImage } from "../../middlewares/upload.middleware";
import {
  editProfile,
  getMyProfessional,
  joinKarigoAsProfessional,
  searchPlacesAutocomplete,
  updateBranch,
} from "../controllers/users.controller";
import {
  joinProfessionalSchema,
  updateBranchSchema,
  uploadProfileSchema,
} from "../validation/user.validation";

const router = express.Router();

router.get("/places/autocomplete", verifyToken, searchPlacesAutocomplete);

router.get("/me/professional", verifyToken, getMyProfessional);

router.put(
  "/branch",
  verifyToken,
  validate(updateBranchSchema, "UPDATE_BRANCH_VALIDATION_FAILED", "users"),
  updateBranch
);

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
