import { Request, Response, NextFunction } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import { editUserProfileService, joinKarigoProfessionalService } from "../services/user.service";
import { JoinProfessionalInput, UploadProfileInput } from "../validation/user.validation";

export const editProfile = async (
  req: Request<{}, {}, UploadProfileInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as Request & { user?: { userId: string } }).user;
    if (!user?.userId) {
      const error = new Error("Unauthorized") as Error & { statusCode: number };
      error.statusCode = 401;
      throw error;
    }

    const userId = user.userId;
    const file = req.file;

    const updatedUser = await editUserProfileService(
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

export const joinKarigoAsProfessional = async (
  req: Request<{}, {}, JoinProfessionalInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as Request & { user?: { userId: string } }).user;
    if (!user?.userId) {
      const error = new Error("Unauthorized") as Error & { statusCode: number };
      error.statusCode = 401;
      throw error;
    }

    const created = await joinKarigoProfessionalService(
      user.userId,
      req.body.categoryId,
      req.body.subCategoryIds,
      req.file
    );

    logInfo("Professional join application submitted", {
      service: "users",
      event: "JOIN_PROFESSIONAL_SUCCESS",
      userId: user.userId,
      path: req.path,
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Application submitted successfully",
      data: created,
    });
  } catch (error: any) {
    logError("Professional join application failed", {
      service: "users",
      event: "JOIN_PROFESSIONAL_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};
