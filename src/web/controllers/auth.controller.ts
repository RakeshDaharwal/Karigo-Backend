import { Request, Response, NextFunction } from "express";
import {
  getSuperAdminProfileService,
  superAdminLoginService,
  verifySuperAdminOtpService,
} from "../services/auth.service";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  SuperAdminLoginInput,
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
