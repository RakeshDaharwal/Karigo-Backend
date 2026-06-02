import { ulid } from "ulid";
import {
  clearCartItems,
  findCartByUserId,
  updateCartDeliveryAddress,
  updateCartTotal,
} from "../../repositories/cart.repository";
import { findUserAddressById } from "../../repositories/address.repository";
import {
  createOrderWithItems,
  findOrderForUser,
  listOrdersByUser,
} from "../../repositories/order.repository";
import { PaymentMethod } from "../../generated/prisma/enums";

const httpError = (status: number, message: string) => {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = status;
  return err;
};

export const placeOrderService = async (
  userId: string,
  addressId: string,
  paymentMethod: PaymentMethod = "COD"
) => {
  const cart = await findCartByUserId(userId);
  if (!cart || cart.items.length === 0) {
    throw httpError(400, "Your cart is empty");
  }

  const address = await findUserAddressById(addressId, userId);
  if (!address) {
    throw httpError(404, "Address not found");
  }

  const totalPrice = cart.items.reduce(
    (sum, it) => sum + it.quantity * it.price,
    0
  );

  const addressSnapshot = {
    id: address.id,
    name: address.name,
    contactNumber: address.contactNumber,
    houseNo: address.houseNo,
    addressLine: address.addressLine,
    addressType: address.addressType,
  };

  const order = await createOrderWithItems({
    id: ulid(),
    userId,
    deliveryAddress: addressSnapshot,
    totalPrice,
    paymentMethod,
    items: cart.items.map((it) => ({
      id: ulid(),
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      price: it.price,
    })),
  });

  await clearCartItems(cart.id);
  await updateCartTotal(cart.id, 0);
  await updateCartDeliveryAddress(cart.id, null);

  return order;
};

export const listMyOrdersService = (userId: string) => listOrdersByUser(userId);

export const getOrderDetailsService = async (
  userId: string,
  orderId: string
) => {
  const order = await findOrderForUser(orderId, userId);
  if (!order) {
    throw httpError(404, "Order not found");
  }
  return order;
};
