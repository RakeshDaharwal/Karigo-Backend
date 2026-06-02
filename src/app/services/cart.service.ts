import { ulid } from "ulid";
import prisma from "../../config/db.conn";
import {
  clearCartItems,
  createCartForUser,
  deleteCartItem,
  findCartByUserId,
  updateCartDeliveryAddress,
  updateCartTotal,
  upsertCartItem,
} from "../../repositories/cart.repository";
import { findUserAddressById } from "../../repositories/address.repository";

const httpError = (status: number, message: string) => {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = status;
  return err;
};

const recalcCartTotal = (
  items: { quantity: number; price: number }[]
): number =>
  items.reduce((sum, it) => sum + it.quantity * it.price, 0);

const ensureCart = async (userId: string) => {
  const existing = await findCartByUserId(userId);
  if (existing) return existing;
  return createCartForUser(ulid(), userId);
};

const reloadCart = async (userId: string) => {
  const cart = await findCartByUserId(userId);
  if (!cart) {
    throw httpError(500, "Cart could not be loaded");
  }
  return cart;
};

export const getOrCreateCartService = async (userId: string) => {
  const cart = await ensureCart(userId);
  return cart;
};

export const addItemToCartService = async (
  userId: string,
  productId: string,
  quantity: number
) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw httpError(404, "Product not found");
  }

  const cart = await ensureCart(userId);

  await upsertCartItem({
    id: ulid(),
    cartId: cart.id,
    productId,
    productName: product.name,
    quantity,
    price: product.price,
  });

  const refreshed = await reloadCart(userId);
  const total = recalcCartTotal(refreshed.items);
  await updateCartTotal(refreshed.id, total);

  return reloadCart(userId);
};

export const updateItemQuantityService = async (
  userId: string,
  productId: string,
  quantity: number
) => {
  const cart = await findCartByUserId(userId);
  if (!cart) {
    throw httpError(404, "Cart is empty");
  }

  if (quantity === 0) {
    await deleteCartItem(cart.id, productId);
  } else {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw httpError(404, "Product not found");
    }
    await upsertCartItem({
      id: ulid(),
      cartId: cart.id,
      productId,
      productName: product.name,
      quantity,
      price: product.price,
    });
  }

  const refreshed = await reloadCart(userId);
  const total = recalcCartTotal(refreshed.items);
  await updateCartTotal(refreshed.id, total);

  return reloadCart(userId);
};

export const setDeliveryAddressService = async (
  userId: string,
  addressId: string
) => {
  const address = await findUserAddressById(addressId, userId);
  if (!address) {
    throw httpError(404, "Address not found");
  }
  const cart = await ensureCart(userId);
  return updateCartDeliveryAddress(cart.id, addressId);
};

export const clearCartService = async (userId: string) => {
  const cart = await findCartByUserId(userId);
  if (!cart) return { id: null };
  await clearCartItems(cart.id);
  await updateCartTotal(cart.id, 0);
  return reloadCart(userId);
};
