import { Request, Response, NextFunction } from "express";
import { userLoginService, verifyOtpService } from "../services/auth.service";
import { logError, logInfo } from "../../utils/logger.utils";
import { UserLoginInput, VerifyOtpInput } from "../validation/auth.validation";

export const userLogin = async (
  req: Request<{}, {}, UserLoginInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { mobile } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    const loginData = await userLoginService(mobile, ip);

    logInfo("User login OTP generated", {
      service: "auth",
      event: "USER_LOGIN_SUCCESS",
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
    logError("User login failed", {
      service: "auth",
      event: "USER_LOGIN_FAILED",
      mobile: req.body?.mobile,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const verifyOtp = async (
  req: Request<{}, {}, VerifyOtpInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { mobile, otp } = req.body;

    const verifyData = await verifyOtpService(mobile, otp);

    logInfo("OTP verified successfully", {
      service: "auth",
      event: "VERIFY_OTP_SUCCESS",
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
    logError("OTP verification failed", {
      service: "auth",
      event: "VERIFY_OTP_FAILED",
      mobile: req.body?.mobile,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};
