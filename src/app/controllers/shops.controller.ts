import { Request, Response, NextFunction } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  getApprovedShopWithProductsService,
  getMyShopsService,
  getNearbyApprovedShopsService,
  onboardShopService,
} from "../services/shops.service";
import {
  NearbyShopsBody,
  OnboardShopInput,
} from "../validation/shops.validation";

export const onboardShop = async (
  req: Request<{}, {}, OnboardShopInput>,
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

    const created = await onboardShopService(user.userId, req.body, req.file);

    logInfo("Shop onboarding submitted", {
      service: "shops",
      event: "ONBOARD_SHOP_SUCCESS",
      userId: user.userId,
      shopId: created.id,
      path: req.path,
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Shop submitted for review",
      data: created,
    });
  } catch (error: any) {
    logError("Shop onboarding failed", {
      service: "shops",
      event: "ONBOARD_SHOP_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const getMyShops = async (
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

    const shops = await getMyShopsService(user.userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: shops.length ? "Shops fetched" : "No shop onboarded yet",
      data: shops,
    });
  } catch (error: any) {
    logError("Get my shops failed", {
      service: "shops",
      event: "GET_MY_SHOPS_FAILED",
      userId: (req as any)?.user?.userId,
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
    const user = (req as Request & { user?: { userId: string } }).user;
    if (!user?.userId) {
      const error = new Error("Unauthorized") as Error & { statusCode: number };
      error.statusCode = 401;
      throw error;
    }

    const { shopId } = req.params;
    if (!shopId) {
      const error = new Error("shopId is required") as Error & {
        statusCode: number;
      };
      error.statusCode = 400;
      throw error;
    }

    const data = await getApprovedShopWithProductsService(shopId);

    const productCount = data.stores.reduce(
      (acc, s) => acc + s.products.length,
      0
    );

    logInfo("Shop details fetched", {
      service: "shops",
      event: "GET_SHOP_DETAILS_SUCCESS",
      userId: user.userId,
      shopId,
      storeCount: data.stores.length,
      productCount,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Shop fetched",
      data,
    });
  } catch (error: any) {
    logError("Shop details failed", {
      service: "shops",
      event: "GET_SHOP_DETAILS_FAILED",
      userId: (req as any)?.user?.userId,
      shopId: (req as any)?.params?.shopId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const getNearbyShops = async (
  req: Request<{}, {}, NearbyShopsBody>,
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

    const { latitude, longitude } = req.body;
    const data = await getNearbyApprovedShopsService(latitude, longitude);

    logInfo("Nearby shops fetched", {
      service: "shops",
      event: "GET_NEARBY_SHOPS_SUCCESS",
      userId: user.userId,
      count: data.shops.length,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: data.shops.length ? "Shops fetched" : "No shops near you",
      data,
    });
  } catch (error: any) {
    logError("Nearby shops failed", {
      service: "shops",
      event: "GET_NEARBY_SHOPS_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};
