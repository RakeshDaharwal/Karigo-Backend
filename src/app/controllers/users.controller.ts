import { Request, Response, NextFunction } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import { autocompletePlaces } from "../../utils/geoapify.utils";
import {
  editUserProfileService,
  getMyProfessionalProfileService,
  joinKarigoProfessionalService,
  updateUserBranchService,
} from "../services/user.service";
import {
  autocompletePlacesQuerySchema,
  JoinProfessionalInput,
  UpdateBranchInput,
  UploadProfileInput,
} from "../validation/user.validation";

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

export const searchPlacesAutocomplete = async (
  req: Request,
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

    const parsed = autocompletePlacesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: parsed.error.issues[0].message,
      });
    }

    const results = await autocompletePlaces(parsed.data.text);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Places fetched successfully",
      data: results,
    });
  } catch (error: any) {
    if (error?.message === "GEOAPIFY_API_KEY is not configured") {
      return res.status(503).json({
        success: false,
        statusCode: 503,
        message: "Place search is not configured",
      });
    }

    logError("Place autocomplete failed", {
      service: "users",
      event: "PLACES_AUTOCOMPLETE_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const updateBranch = async (
  req: Request<{}, {}, UpdateBranchInput>,
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

    const updatedUser = await updateUserBranchService(user.userId, req.body);

    logInfo("Branch updated successfully", {
      service: "users",
      event: "UPDATE_BRANCH_SUCCESS",
      userId: user.userId,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Branch updated successfully",
      data: updatedUser,
    });
  } catch (error: any) {
    logError("Branch update failed", {
      service: "users",
      event: "UPDATE_BRANCH_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const getMyProfessional = async (
  req: Request,
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

    const data = await getMyProfessionalProfileService(user.userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: data ? "Professional profile" : "No professional application",
      data,
    });
  } catch (error: any) {
    logError("Get my professional failed", {
      service: "users",
      event: "GET_MY_PROFESSIONAL_FAILED",
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Aadhaar document is required",
      });
    }

    const created = await joinKarigoProfessionalService(
      user.userId,
      req.body.categoryId,
      req.body.experienceYears,
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
