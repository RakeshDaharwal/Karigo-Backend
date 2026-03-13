import { Request, Response, NextFunction } from "express";
import {
  orgSignUpService,
  orgSignInService,
} from "../../services/web/auth.service";
import { logError, logInfo } from "../../utils/logger";
import { generateAppAccessToken } from "../../utils/jwtHelper";
import {
  OrgSignUpInput,
  OrgSignInInput,
} from "../../validation/web/org.validation";

// ================= SIGN UP =================

export const orgSignUp = async (
  req: Request<{}, {}, OrgSignUpInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

console.log(req.body)


    const organization = await orgSignUpService(name, email, password);

    logInfo("Organization created", {
      service: "organization",
      event: "ORG_SIGNUP_SUCCESS",
      email,
      path: req.path,
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Organization created successfully",
      data: organization,
    });
  } catch (error: any) {
    logError("Organization signup failed", {
      service: "organization",
      event: "ORG_SIGNUP_FAILED",
      email: req.body?.email,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

// ================= SIGN IN =================

export const orgSignIn = async (
  req: Request<{}, {}, OrgSignInInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const organization = await orgSignInService(email, password);

    const accessToken = generateAppAccessToken(organization.id);

    logInfo("Organization login successful", {
      service: "organization",
      event: "ORG_SIGNIN_SUCCESS",
      email,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Login successful",
      data: {
        id: organization.id,
        name: organization.name,
        email: organization.email,
        accessToken,
      },
    });
  } catch (error: any) {
    logError("Organization login failed", {
      service: "organization",
      event: "ORG_SIGNIN_FAILED",
      email: req.body?.email,
      path: req.path,
      error: error.message,
    });

    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: error.message || "Login failed",
    });
  }
};
