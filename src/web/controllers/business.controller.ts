import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  getBusinessDetailsService,
  getBusinessStatsService,
  listBusinessesService,
  reviewBusinessRequestService,
} from "../services/business.service";
import {
  listBusinessesQuerySchema,
  ReviewBusinessRequestInput,
  businessIdParamSchema,
} from "../validation/business.validation";

export const getBusinessStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getBusinessStatsService();

    logInfo("Business stats fetched", {
      service: "business",
      event: "GET_BUSINESS_STATS_SUCCESS",
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Business stats fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("Business stats fetch failed", {
      service: "business",
      event: "GET_BUSINESS_STATS_FAILED",
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const listBusinesses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = listBusinessesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const err = new Error(parsed.error.issues[0].message) as Error & {
        statusCode: number;
      };
      err.statusCode = 400;
      throw err;
    }

    const data = await listBusinessesService(parsed.data);

    logInfo("Businesses listed", {
      service: "business",
      event: "LIST_BUSINESSES_SUCCESS",
      status: parsed.data.status,
      categoryId: parsed.data.categoryId,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Businesses fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("List businesses failed", {
      service: "business",
      event: "LIST_BUSINESSES_FAILED",
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const getBusinessDetails = async (
  req: Request<{ businessId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = businessIdParamSchema.safeParse({
      businessId: req.params.businessId,
    });
    if (!parsed.success) {
      const err = new Error(parsed.error.issues[0].message) as Error & {
        statusCode: number;
      };
      err.statusCode = 400;
      throw err;
    }

    const data = await getBusinessDetailsService(parsed.data.businessId);

    logInfo("Business details fetched", {
      service: "business",
      event: "GET_BUSINESS_DETAILS_SUCCESS",
      businessId: parsed.data.businessId,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Business details fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("Business details fetch failed", {
      service: "business",
      event: "GET_BUSINESS_DETAILS_FAILED",
      businessId: req.params?.businessId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const reviewBusinessRequest = async (
  req: Request<{ businessId: string }, {}, ReviewBusinessRequestInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { businessId } = req.params;
    const { status } = req.body;

    const data = await reviewBusinessRequestService(businessId, status);

    logInfo("Business application reviewed", {
      service: "business",
      event: "BUSINESS_REQUEST_REVIEWED",
      businessId,
      decision: status,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message:
        status === "APPROVED"
          ? "Business application approved"
          : "Business application rejected",
      data,
    });
  } catch (error: any) {
    logError("Business application review failed", {
      service: "business",
      event: "BUSINESS_REQUEST_REVIEW_FAILED",
      businessId: req.params.businessId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};
