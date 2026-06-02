import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  addCartItem,
  clearCart,
  getCart,
  setCartDeliveryAddress,
  updateCartItem,
} from "../controllers/cart.controller";
import {
  addCartItemSchema,
  setDeliveryAddressSchema,
  updateCartItemSchema,
} from "../validation/cart.validation";

const router = express.Router();

router.get("/", verifyToken, getCart);

router.post(
  "/items",
  verifyToken,
  validate(addCartItemSchema, "ADD_CART_ITEM_VALIDATION_FAILED", "cart"),
  addCartItem
);

router.put(
  "/items",
  verifyToken,
  validate(updateCartItemSchema, "UPDATE_CART_ITEM_VALIDATION_FAILED", "cart"),
  updateCartItem
);

router.put(
  "/delivery-address",
  verifyToken,
  validate(
    setDeliveryAddressSchema,
    "SET_CART_ADDRESS_VALIDATION_FAILED",
    "cart"
  ),
  setCartDeliveryAddress
);

router.delete("/", verifyToken, clearCart);

export default router;
