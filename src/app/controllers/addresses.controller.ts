import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  createAddressService,
  deleteAddressService,
  listAddressesService,
} from "../services/addresses.service";
import { CreateAddressInput } from "../validation/addresses.validation";

const requireUserId = (req: Request) => {
  const user = (req as Request & { user?: { userId: string } }).user;
  if (!user?.userId) {
    const err = new Error("Unauthorized") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }
  return user.userId;
};

export const createAddress = async (
  req: Request<{}, {}, CreateAddressInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const address = await createAddressService(userId, req.body);

    logInfo("Address created", {
      service: "addresses",
      event: "CREATE_ADDRESS_SUCCESS",
      userId,
      addressId: address.id,
      path: req.path,
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Address saved",
      data: address,
    });
  } catch (error: any) {
    logError("Create address failed", {
      service: "addresses",
      event: "CREATE_ADDRESS_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const listAddresses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const list = await listAddressesService(userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: list.length ? "Addresses fetched" : "No addresses saved",
      data: list,
    });
  } catch (error: any) {
    logError("List addresses failed", {
      service: "addresses",
      event: "LIST_ADDRESSES_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const deleteAddress = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const result = await deleteAddressService(userId, req.params.id);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Address removed",
      data: result,
    });
  } catch (error: any) {
    logError("Delete address failed", {
      service: "addresses",
      event: "DELETE_ADDRESS_FAILED",
      userId: (req as any)?.user?.userId,
      addressId: (req as any)?.params?.id,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};
