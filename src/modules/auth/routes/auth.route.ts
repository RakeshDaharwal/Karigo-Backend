import express from "express";
import {
  superAdminLogin,
  userLogin,
  verifyOtp,
  verifySuperAdminOtp,
} from "../controllers/auth.controller";
import { validate } from "../../../middlewares/validate.middleware";
import {
  superAdminLoginSchema,
  userLoginSchema,
  verifySuperAdminOtpSchema,
  verifyOtpSchema,
} from "../validation/org.validation";

const router = express.Router();

router.post(
  "/user/login",
  validate(userLoginSchema, "USER_LOGIN_VALIDATION_FAILED", "auth"),
  userLogin
);

router.post(
  "/user/verify",
  validate(verifyOtpSchema, "VERIFY_OTP_VALIDATION_FAILED", "auth"),
  verifyOtp
);

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

export default router;