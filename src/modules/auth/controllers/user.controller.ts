import { Request, Response, NextFunction } from "express";
import { logError, logInfo } from "../../../utils/logger.utils";
import { updateUserProfileService } from "../services/user.service";
import { UpdateProfileInput } from "../validation/user.validation";

const createError = (message: string, statusCode: number) => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
};

export const updateProfile = async (
  req: Request<{}, {}, UpdateProfileInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as Request & { user?: { userId: number } }).user;
    if (!user?.userId) {
      throw createError("Unauthorized", 401);
    }

    const userId = user.userId;
    const file = req.file;

    const updatedUser = await updateUserProfileService(
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