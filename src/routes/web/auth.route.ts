import express from "express";
import { orgSignIn, orgSignUp } from "../../controller/web/auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import {
  orgSignUpSchema,
  orgSignInSchema,
} from "../../validation/web/org.validation";

const router = express.Router();

router.post(
  "/org/signup",
  validate(orgSignUpSchema, "ORG_SIGNUP_VALIDATION_FAILED", "organization"),
  orgSignUp
);

router.post(
  "/org/signin",
  validate(orgSignInSchema, "ORG_SIGNIN_VALIDATION_FAILED", "organization"),
  orgSignIn
);

export default router;