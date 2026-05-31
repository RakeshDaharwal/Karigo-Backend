import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  getShopDetailsService,
  getShopStatsService,
  listShopsService,
  reviewShopRequestService,
} from "../services/shop.service";
import {
  listShopsQuerySchema,
  ReviewShopRequestInput,
  shopIdParamSchema,
} from "../validation/shop.validation";

export const getShopStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getShopStatsService();

    logInfo("Shop stats fetched", {
      service: "shop",
      event: "GET_SHOP_STATS_SUCCESS",
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Shop stats fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("Shop stats fetch failed", {
      service: "shop",
      event: "GET_SHOP_STATS_FAILED",
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const listShops = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = listShopsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const err = new Error(parsed.error.issues[0].message) as Error & {
        statusCode: number;
      };
      err.statusCode = 400;
      throw err;
    }

    const data = await listShopsService(parsed.data);

    logInfo("Shops listed", {
      service: "shop",
      event: "LIST_SHOPS_SUCCESS",
      status: parsed.data.status,
      category: parsed.data.category,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Shops fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("List shops failed", {
      service: "shop",
      event: "LIST_SHOPS_FAILED",
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const getShopDetails = async (
  req: Request<{ shopId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = shopIdParamSchema.safeParse({ shopId: req.params.shopId });
    if (!parsed.success) {
      const err = new Error(parsed.error.issues[0].message) as Error & {
        statusCode: number;
      };
      err.statusCode = 400;
      throw err;
    }

    const data = await getShopDetailsService(parsed.data.shopId);

    logInfo("Shop details fetched", {
      service: "shop",
      event: "GET_SHOP_DETAILS_SUCCESS",
      shopId: parsed.data.shopId,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Shop details fetched successfully",
      data,
    });
  } catch (error: any) {
    logError("Shop details fetch failed", {
      service: "shop",
      event: "GET_SHOP_DETAILS_FAILED",
      shopId: req.params?.shopId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const reviewShopRequest = async (
  req: Request<{ shopId: string }, {}, ReviewShopRequestInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shopId } = req.params;
    const { status } = req.body;

    const data = await reviewShopRequestService(shopId, status);

    logInfo("Shop application reviewed", {
      service: "shop",
      event: "SHOP_REQUEST_REVIEWED",
      shopId,
      decision: status,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message:
        status === "APPROVED"
          ? "Shop application approved"
          : "Shop application rejected",
      data,
    });
  } catch (error: any) {
    logError("Shop application review failed", {
      service: "shop",
      event: "SHOP_REQUEST_REVIEW_FAILED",
      shopId: req.params.shopId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};
