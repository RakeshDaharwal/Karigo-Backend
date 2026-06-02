import prisma from "../config/db.conn";

export const findCartByUserId = (userId: string) =>
  prisma.cart.findUnique({
    where: { userId },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      deliveryAddress: true,
    },
  });

export const createCartForUser = (id: string, userId: string) =>
  prisma.cart.create({
    data: { id, userId },
    include: {
      items: true,
      deliveryAddress: true,
    },
  });

export const updateCartTotal = (cartId: string, totalPrice: number) =>
  prisma.cart.update({
    where: { id: cartId },
    data: { totalPrice },
  });

export const updateCartDeliveryAddress = (
  cartId: string,
  deliveryAddressId: string | null
) =>
  prisma.cart.update({
    where: { id: cartId },
    data: { deliveryAddressId },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      deliveryAddress: true,
    },
  });

export const findCartItem = (cartId: string, productId: string) =>
  prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  });

export const upsertCartItem = (data: {
  id: string;
  cartId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}) =>
  prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: data.cartId, productId: data.productId } },
    update: {
      quantity: data.quantity,
      price: data.price,
      productName: data.productName,
    },
    create: data,
  });

export const deleteCartItem = (cartId: string, productId: string) =>
  prisma.cartItem.deleteMany({ where: { cartId, productId } });

export const clearCartItems = (cartId: string) =>
  prisma.cartItem.deleteMany({ where: { cartId } });
