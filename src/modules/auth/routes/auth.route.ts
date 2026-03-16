import express from "express";
import { userLogin, verifyOtp } from "../controllers/auth.controller";
import { validate } from "../../../middlewares/validate.middleware";
import {
  userLoginSchema,
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

export default router;