import express from "express";
import {
  businessLogin,
  getBusinessMe,
  getSuperAdminMe,
  superAdminLogin,
  verifyBusinessOtp,
  verifySuperAdminOtp,
} from "../controllers/auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import {
  requireBusinessUser,
  requireSuperAdmin,
} from "../../middlewares/auth.middleware";
import {
  businessLoginSchema,
  superAdminLoginSchema,
  verifyBusinessOtpSchema,
  verifySuperAdminOtpSchema,
} from "../validation/auth.validation";

const router = express.Router();

router.get("/super-admin/me", requireSuperAdmin, getSuperAdminMe);

router.post(
  "/super-admin/login",
  validate(
    superAdminLoginSchema,
    "SUPER_ADMIN_LOGIN_VALIDATION_FAILED",
    "auth"
  ),
  superAdminLogin
);

router.post(
  "/super-admin/verify",
  validate(
    verifySuperAdminOtpSchema,
    "VERIFY_SUPER_ADMIN_OTP_VALIDATION_FAILED",
    "auth"
  ),
  verifySuperAdminOtp
);

router.get("/business/me", requireBusinessUser, getBusinessMe);

router.post(
  "/business/login",
  validate(businessLoginSchema, "BUSINESS_LOGIN_VALIDATION_FAILED", "auth"),
  businessLogin
);

router.post(
  "/business/verify",
  validate(
    verifyBusinessOtpSchema,
    "VERIFY_BUSINESS_OTP_VALIDATION_FAILED",
    "auth"
  ),
  verifyBusinessOtp
);

export default router;
