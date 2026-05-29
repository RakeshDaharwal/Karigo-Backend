import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import { getDashboardOverviewService } from "../services/analytics.service";

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
