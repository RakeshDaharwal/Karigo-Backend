import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  getBusinessOverviewService,
  getDashboardOverviewService,
} from "../services/analytics.service";

export const getDashboardOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const overview = await getDashboardOverviewService();

    logInfo("Dashboard overview fetched", {
      service: "analytics",
      event: "GET_DASHBOARD_OVERVIEW_SUCCESS",
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Dashboard overview fetched successfully",
      data: overview,
    });
  } catch (error: any) {
    logError("Dashboard overview fetch failed", {
      service: "analytics",
      event: "GET_DASHBOARD_OVERVIEW_FAILED",
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const getBusinessOverview = async (
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

    const overview = await getBusinessOverviewService(user.userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Business overview fetched successfully",
      data: overview,
    });
  } catch (error: any) {
    logError("Business overview fetch failed", {
      service: "analytics",
      event: "GET_BUSINESS_OVERVIEW_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};
