import { z } from "zod";

const trim = (val: unknown) => (typeof val === "string" ? val.trim() : val);

export const addCartItemSchema = z.object({
  productId: z.preprocess(
    trim,
    z.string().min(1, "productId is required")
  ),
  quantity: z
    .number({ message: "quantity is required" })
    .int("quantity must be a whole number")
    .min(1, "quantity must be at least 1")
    .max(999, "quantity is too large"),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const updateCartItemSchema = z.object({
  productId: z.preprocess(
    trim,
    z.string().min(1, "productId is required")
  ),
  quantity: z
    .number({ message: "quantity is required" })
    .int("quantity must be a whole number")
    .min(0, "quantity cannot be negative")
    .max(999, "quantity is too large"),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export const setDeliveryAddressSchema = z.object({
  addressId: z.preprocess(
    trim,
    z.string().min(1, "addressId is required")
  ),
});

export type SetDeliveryAddressInput = z.infer<typeof setDeliveryAddressSchema>;
