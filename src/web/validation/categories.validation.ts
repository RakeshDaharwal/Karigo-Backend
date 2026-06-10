import { z } from "zod";

const idSchema = z.string().refine(
  (v) =>
    /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(v) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
  "Category id must be a valid id"
);

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .max(80, "Category name must be under 80 characters")
    .transform((value) => value.replace(/\s+/g, " "))
    .refine((value) => value.length >= 2, "Category name is required"),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .max(80, "Category name must be under 80 characters")
    .transform((value) => value.replace(/\s+/g, " "))
    .refine((value) => value.length >= 2, "Category name is required"),
});

export const categoryIdSchema = z.object({
  id: idSchema,
});

export const reorderCategoriesSchema = z.object({
  orderedIds: z
    .array(idSchema)
    .min(1, "At least one category id is required"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
