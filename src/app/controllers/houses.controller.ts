import { Request, Response, NextFunction } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  getMyHousesService,
  getNearbyApprovedHousesService,
  listHouseService,
} from "../services/houses.service";
import { ListHouseInput, NearbyListingsBody } from "../validation/houses.validation";

export const listHouse = async (
  req: Request<{}, {}, ListHouseInput>,
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

    const created = await listHouseService(user.userId, req.body, req.file);

    logInfo("House listing submitted", {
      service: "houses",
      event: "LIST_HOUSE_SUCCESS",
      userId: user.userId,
      houseId: created.id,
      path: req.path,
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Property submitted for review",
      data: created,
    });
  } catch (error: any) {
    logError("House listing failed", {
      service: "houses",
      event: "LIST_HOUSE_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const getMyHouses = async (
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

    const houses = await getMyHousesService(user.userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: houses.length ? "Properties fetched" : "No properties listed yet",
      data: houses,
    });
  } catch (error: any) {
    logError("Get my houses failed", {
      service: "houses",
      event: "GET_MY_HOUSES_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const getNearbyHouses = async (
  req: Request<{}, {}, NearbyListingsBody>,
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
    const data = await getNearbyApprovedHousesService(latitude, longitude);

    logInfo("Nearby houses fetched", {
      service: "houses",
      event: "GET_NEARBY_HOUSES_SUCCESS",
      userId: user.userId,
      count: data.houses.length,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: data.houses.length ? "Properties fetched" : "No properties near you",
      data,
    });
  } catch (error: any) {
    logError("Nearby houses failed", {
      service: "houses",
      event: "GET_NEARBY_HOUSES_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};
