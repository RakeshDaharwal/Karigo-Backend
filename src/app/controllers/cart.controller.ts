import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  addItemToCartService,
  clearCartService,
  getOrCreateCartService,
  setDeliveryAddressService,
  updateItemQuantityService,
} from "../services/cart.service";
import {
  AddCartItemInput,
  SetDeliveryAddressInput,
  UpdateCartItemInput,
} from "../validation/cart.validation";

const requireUserId = (req: Request) => {
  const user = (req as Request & { user?: { userId: string } }).user;
  if (!user?.userId) {
    const err = new Error("Unauthorized") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }
  return user.userId;
};

export const getCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const cart = await getOrCreateCartService(userId);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Cart fetched",
      data: cart,
    });
  } catch (error: any) {
    logError("Get cart failed", {
      service: "cart",
      event: "GET_CART_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const addCartItem = async (
  req: Request<{}, {}, AddCartItemInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const cart = await addItemToCartService(
      userId,
      req.body.productId,
      req.body.quantity
    );

    logInfo("Cart item added", {
      service: "cart",
      event: "ADD_CART_ITEM_SUCCESS",
      userId,
      productId: req.body.productId,
      quantity: req.body.quantity,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Item added to cart",
      data: cart,
    });
  } catch (error: any) {
    logError("Add cart item failed", {
      service: "cart",
      event: "ADD_CART_ITEM_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const updateCartItem = async (
  req: Request<{}, {}, UpdateCartItemInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const cart = await updateItemQuantityService(
      userId,
      req.body.productId,
      req.body.quantity
    );
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Cart updated",
      data: cart,
    });
  } catch (error: any) {
    logError("Update cart item failed", {
      service: "cart",
      event: "UPDATE_CART_ITEM_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const setCartDeliveryAddress = async (
  req: Request<{}, {}, SetDeliveryAddressInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const cart = await setDeliveryAddressService(userId, req.body.addressId);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Delivery address selected",
      data: cart,
    });
  } catch (error: any) {
    logError("Set cart address failed", {
      service: "cart",
      event: "SET_CART_ADDRESS_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const clearCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const cart = await clearCartService(userId);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Cart cleared",
      data: cart,
    });
  } catch (error: any) {
    logError("Clear cart failed", {
      service: "cart",
      event: "CLEAR_CART_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};
