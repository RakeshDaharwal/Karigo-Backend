import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .max(80, "Category name must be under 80 characters")
    .transform((value) => value.replace(/\s+/g, ""))
    .refine((value) => value.length >= 2, "Category name is required"),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .max(80, "Category name must be under 80 characters")
    .transform((value) => value.replace(/\s+/g, ""))
    .refine((value) => value.length >= 2, "Category name is required"),
});

export const categoryIdSchema = z.object({
  id: z.string().refine(
    (v) =>
      /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(v) ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
    "Category id must be a valid id"
  ),
});

export const createSubCategorySchema = z.object({
  categoryId: z.string().refine(
    (v) =>
      /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(v) ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
    "Category id must be a valid id"
  ),
  name: z
    .string()
    .trim()
    .max(80, "Subcategory name must be under 80 characters")
    .transform((value) => value.replace(/\s+/g, " "))
    .refine((value) => value.length >= 2, "Subcategory name is required"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateSubCategoryInput = z.infer<typeof createSubCategorySchema>;
