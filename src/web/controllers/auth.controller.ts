import { Request, Response, NextFunction } from "express";
import {
  businessLoginService,
  getBusinessProfileService,
  getSuperAdminProfileService,
  superAdminLoginService,
  verifyBusinessOtpService,
  verifySuperAdminOtpService,
} from "../services/auth.service";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  BusinessLoginInput,
  SuperAdminLoginInput,
  VerifyBusinessOtpInput,
  VerifySuperAdminOtpInput,
} from "../validation/auth.validation";

export const superAdminLogin = async (
  req: Request<{}, {}, SuperAdminLoginInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { mobile } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    const loginData = await superAdminLoginService(mobile, ip);

    logInfo("Super admin login OTP generated", {
      service: "auth",
      event: "SUPER_ADMIN_LOGIN_SUCCESS",
      mobile,
      ip,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "OTP sent successfully",
      data: loginData,
    });
  } catch (error: any) {
    logError("Super admin login failed", {
      service: "auth",
      event: "SUPER_ADMIN_LOGIN_FAILED",
      mobile: req.body?.mobile,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const getSuperAdminMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as Request & { user?: { userId: string } }).user;
    if (!user?.userId) {
      const err = new Error("Unauthorized") as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    const data = await getSuperAdminProfileService(user.userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Profile fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("Super admin profile fetch failed", {
      service: "auth",
      event: "GET_SUPER_ADMIN_ME_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const verifySuperAdminOtp = async (
  req: Request<{}, {}, VerifySuperAdminOtpInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { mobile, otp } = req.body;

    const verifyData = await verifySuperAdminOtpService(mobile, otp);

    logInfo("Super admin OTP verified successfully", {
      service: "auth",
      event: "VERIFY_SUPER_ADMIN_OTP_SUCCESS",
      mobile,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "OTP verified successfully",
      data: verifyData,
    });
  } catch (error: any) {
    logError("Super admin OTP verification failed", {
      service: "auth",
      event: "VERIFY_SUPER_ADMIN_OTP_FAILED",
      mobile: req.body?.mobile,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const businessLogin = async (
  req: Request<{}, {}, BusinessLoginInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { mobile } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    const loginData = await businessLoginService(mobile, ip);

    logInfo("Business login OTP generated", {
      service: "auth",
      event: "BUSINESS_LOGIN_SUCCESS",
      mobile,
      ip,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "OTP sent successfully",
      data: loginData,
    });
  } catch (error: any) {
    logError("Business login failed", {
      service: "auth",
      event: "BUSINESS_LOGIN_FAILED",
      mobile: req.body?.mobile,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const verifyBusinessOtp = async (
  req: Request<{}, {}, VerifyBusinessOtpInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { mobile, otp } = req.body;

    const verifyData = await verifyBusinessOtpService(mobile, otp);

    logInfo("Business OTP verified successfully", {
      service: "auth",
      event: "VERIFY_BUSINESS_OTP_SUCCESS",
      mobile,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "OTP verified successfully",
      data: verifyData,
    });
  } catch (error: any) {
    logError("Business OTP verification failed", {
      service: "auth",
      event: "VERIFY_BUSINESS_OTP_FAILED",
      mobile: req.body?.mobile,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const getBusinessMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as Request & { user?: { userId: string } }).user;
    if (!user?.userId) {
      const err = new Error("Unauthorized") as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    const data = await getBusinessProfileService(user.userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Profile fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("Business profile fetch failed", {
      service: "auth",
      event: "GET_BUSINESS_ME_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};
