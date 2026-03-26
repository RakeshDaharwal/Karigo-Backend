import { Request, Response, NextFunction } from "express";
import { logError, logInfo } from "../../../utils/logger.utils";
import { uploadUserProfileService } from "../services/user.service";
import { UploadProfileInput } from "../validation/user.validation";

export const uploadProfile = async (
  req: Request<{}, {}, UploadProfileInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as Request & { user?: { userId: number } }).user;
    if (!user?.userId) {
      const error = new Error("Unauthorized") as Error & { statusCode: number };
      error.statusCode = 401;
      throw error;
    }

    const userId = user.userId;
    const file = req.file;

    const updatedUser = await uploadUserProfileService(
      userId,
      req.body,
      file
    );

    logInfo("Profile updated successfully", {
      service: "users",
      event: "UPDATE_PROFILE_SUCCESS",
      userId,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error: any) {
    logError("Profile update failed", {
      service: "users",
      event: "UPDATE_PROFILE_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};