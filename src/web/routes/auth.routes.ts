import express from "express";
import {
  superAdminLogin,
  verifySuperAdminOtp,
} from "../controllers/auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import {
  superAdminLoginSchema,
  verifySuperAdminOtpSchema,
} from "../validation/auth.validation";

const router = express.Router();

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