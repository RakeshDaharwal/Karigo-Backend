import { NextFunction, Request, Response } from "express";
import { logError, logInfo } from "../../utils/logger.utils";
import {
  getOrderDetailsService,
  listMyOrdersService,
  placeOrderService,
} from "../services/orders.service";
import { PlaceOrderInput } from "../validation/orders.validation";

const requireUserId = (req: Request) => {
  const user = (req as Request & { user?: { userId: string } }).user;
  if (!user?.userId) {
    const err = new Error("Unauthorized") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }
  return user.userId;
};

export const placeOrder = async (
  req: Request<{}, {}, PlaceOrderInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const order = await placeOrderService(
      userId,
      req.body.addressId,
      req.body.paymentMethod ?? "COD"
    );

    logInfo("Order placed", {
      service: "orders",
      event: "PLACE_ORDER_SUCCESS",
      userId,
      orderId: order.id,
      total: order.totalPrice,
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Order placed",
      data: order,
    });
  } catch (error: any) {
    logError("Place order failed", {
      service: "orders",
      event: "PLACE_ORDER_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const listMyOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const orders = await listMyOrdersService(userId);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: orders.length ? "Orders fetched" : "No orders yet",
      data: orders,
    });
  } catch (error: any) {
    logError("List my orders failed", {
      service: "orders",
      event: "LIST_MY_ORDERS_FAILED",
      userId: (req as any)?.user?.userId,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};

export const getOrderDetails = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const order = await getOrderDetailsService(userId, req.params.id);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Order fetched",
      data: order,
    });
  } catch (error: any) {
    logError("Get order details failed", {
      service: "orders",
      event: "GET_ORDER_DETAILS_FAILED",
      userId: (req as any)?.user?.userId,
      orderId: (req as any)?.params?.id,
      path: req.path,
      error: error.message,
    });
    next(error);
  }
};
