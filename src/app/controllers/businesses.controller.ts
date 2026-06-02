import { Request, Response, NextFunction } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  getApprovedBusinessWithProductsService,
  getMyBusinessesService,
  getNearbyApprovedBusinessesService,
  onboardBusinessService,
} from "../services/businesses.service";
import {
  NearbyBusinessesBody,
  OnboardBusinessInput,
} from "../validation/businesses.validation";

export const onboardBusiness = async (
  req: Request<{}, {}, OnboardBusinessInput>,
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

    const created = await onboardBusinessService(user.userId, req.body, req.file);

    logInfo("Business onboarding submitted", {
      service: "businesses",
      event: "ONBOARD_BUSINESS_SUCCESS",
      userId: user.userId,
      businessId: created.id,
      path: req.path,
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Business submitted for review",
      data: created,
    });
  } catch (error: any) {
    logError("Business onboarding failed", {
      service: "businesses",
      event: "ONBOARD_BUSINESS_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const getMyBusinesses = async (
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

    const businesses = await getMyBusinessesService(user.userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: businesses.length ? "Businesses fetched" : "No business onboarded yet",
      data: businesses,
    });
  } catch (error: any) {
    logError("Get my businesses failed", {
      service: "businesses",
      event: "GET_MY_BUSINESSES_FAILED",
      userId: (req as any)?.user?.userId,
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
    const user = (req as Request & { user?: { userId: string } }).user;
    if (!user?.userId) {
      const error = new Error("Unauthorized") as Error & { statusCode: number };
      error.statusCode = 401;
      throw error;
    }

    const { businessId } = req.params;
    if (!businessId) {
      const error = new Error("businessId is required") as Error & {
        statusCode: number;
      };
      error.statusCode = 400;
      throw error;
    }

    const data = await getApprovedBusinessWithProductsService(businessId);

    const productCount = data.stores.reduce(
      (acc, s) => acc + s.products.length,
      0
    );

    logInfo("Business details fetched", {
      service: "businesses",
      event: "GET_BUSINESS_DETAILS_SUCCESS",
      userId: user.userId,
      businessId,
      storeCount: data.stores.length,
      productCount,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Business fetched",
      data,
    });
  } catch (error: any) {
    logError("Business details failed", {
      service: "businesses",
      event: "GET_BUSINESS_DETAILS_FAILED",
      userId: (req as any)?.user?.userId,
      businessId: (req as any)?.params?.businessId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};

export const getNearbyBusinesses = async (
  req: Request<{}, {}, NearbyBusinessesBody>,
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
    const data = await getNearbyApprovedBusinessesService(latitude, longitude);

    logInfo("Nearby businesses fetched", {
      service: "businesses",
      event: "GET_NEARBY_BUSINESSES_SUCCESS",
      userId: user.userId,
      count: data.businesses.length,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: data.businesses.length ? "Businesses fetched" : "No businesses near you",
      data,
    });
  } catch (error: any) {
    logError("Nearby businesses failed", {
      service: "businesses",
      event: "GET_NEARBY_BUSINESSES_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });

    next(error);
  }
};
