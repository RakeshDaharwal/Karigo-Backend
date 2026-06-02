import { z } from "zod";

export const createBusinessCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .max(80, "Business category name must be under 80 characters")
    .transform((value) => value.replace(/\s+/g, " "))
    .refine((value) => value.length >= 2, "Business category name is required"),
});

export const updateBusinessCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .max(80, "Business category name must be under 80 characters")
    .transform((value) => value.replace(/\s+/g, " "))
    .refine((value) => value.length >= 2, "Business category name is required"),
});

export const businessCategoryIdSchema = z.object({
  id: z.string().refine(
    (v) =>
      /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(v) ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
    "Business category id must be a valid id"
  ),
});

export type CreateBusinessCategoryInput = z.infer<
  typeof createBusinessCategorySchema
>;
export type UpdateBusinessCategoryInput = z.infer<
  typeof updateBusinessCategorySchema
>;
