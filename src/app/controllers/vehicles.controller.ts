import { Request, Response, NextFunction } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  getMyVehiclesService,
  getNearbyApprovedVehiclesService,
  listVehicleService,
} from "../services/vehicles.service";
import {
  ListVehicleInput,
  NearbyListingsBody,
} from "../validation/vehicles.validation";

export const listVehicle = async (
  req: Request<{}, {}, ListVehicleInput>,
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

    const files = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : [];

    const created = await listVehicleService(user.userId, req.body, files);

    logInfo("Vehicle listing submitted", {
      service: "vehicles",
      event: "LIST_VEHICLE_SUCCESS",
      userId: user.userId,
      vehicleId: created.id,
      path: req.path,
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Vehicle submitted for review",
      data: created,
    });
  } catch (error: any) {
    logError("Vehicle listing failed", {
      service: "vehicles",
      event: "LIST_VEHICLE_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const getMyVehicles = async (
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

    const vehicles = await getMyVehiclesService(user.userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: vehicles.length ? "Vehicles fetched" : "No vehicles listed yet",
      data: vehicles,
    });
  } catch (error: any) {
    logError("Get my vehicles failed", {
      service: "vehicles",
      event: "GET_MY_VEHICLES_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const getNearbyVehicles = async (
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
    const data = await getNearbyApprovedVehiclesService(latitude, longitude);

    logInfo("Nearby vehicles fetched", {
      service: "vehicles",
      event: "GET_NEARBY_VEHICLES_SUCCESS",
      userId: user.userId,
      count: data.vehicles.length,
      path: req.path,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: data.vehicles.length ? "Vehicles fetched" : "No vehicles near you",
      data,
    });
  } catch (error: any) {
    logError("Nearby vehicles failed", {
      service: "vehicles",
      event: "GET_NEARBY_VEHICLES_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};
