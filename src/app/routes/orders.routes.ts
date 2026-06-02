import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  getOrderDetails,
  listMyOrders,
  placeOrder,
} from "../controllers/orders.controller";
import { placeOrderSchema } from "../validation/orders.validation";

const router = express.Router();

router.get("/", verifyToken, listMyOrders);

router.post(
  "/",
  verifyToken,
  validate(placeOrderSchema, "PLACE_ORDER_VALIDATION_FAILED", "orders"),
  placeOrder
);

router.get("/:id", verifyToken, getOrderDetails);

export default router;
