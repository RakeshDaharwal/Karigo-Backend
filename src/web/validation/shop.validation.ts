import { z } from "zod";

const SHOP_CATEGORY_VALUES = [
  "FOOD",
  "GROCERY",
  "HARDWARE",
  "PHARMACY",
  "ELECTRONICS",
  "CLOTHING",
  "SALON",
  "RESTAURANT",
  "STATIONERY",
  "OTHER",
] as const;

export const reviewShopRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECT"], {
    message: "status must be APPROVED or REJECT",
  }),
});

export type ReviewShopRequestInput = z.infer<typeof reviewShopRequestSchema>;

export const listShopsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"], {
    message: "status must be PENDING, APPROVED or REJECTED",
  }),
  category: z
    .preprocess(
      (val) => (typeof val === "string" ? val.trim().toUpperCase() : val),
      z.enum(SHOP_CATEGORY_VALUES).optional()
    )
    .optional(),
  search: z
    .preprocess(
      (val) => (typeof val === "string" ? val.trim() : val),
      z.string().max(120).optional()
    )
    .optional(),
});

export type ListShopsQuery = z.infer<typeof listShopsQuerySchema>;

export const shopIdParamSchema = z.object({
  shopId: z.string().refine(
    (v) =>
      /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(v) ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
    "Shop id must be a valid id"
  ),
});
