import { z } from "zod";

const trim = (val: unknown) => (typeof val === "string" ? val.trim() : val);

export const PAYMENT_METHOD_VALUES = ["COD", "ONLINE"] as const;

export const placeOrderSchema = z.object({
  addressId: z.preprocess(
    trim,
    z.string().min(1, "addressId is required")
  ),
  paymentMethod: z
    .preprocess(
      (val) => (typeof val === "string" ? val.trim().toUpperCase() : val),
      z.enum(PAYMENT_METHOD_VALUES).optional()
    )
    .default("COD"),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
