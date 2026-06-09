import { z } from "zod";

const idSchema = z.string().refine(
  (v) =>
    /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(v) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
  "Id must be a valid id"
);

export const categoryIdParamSchema = z.object({
  id: idSchema,
});

export const subCategoryIdSchema = z.object({
  id: idSchema,
});

export const createSubCategorySchema = z.object({
  categoryId: idSchema,
  name: z
    .string()
    .trim()
    .max(80, "Subcategory name must be under 80 characters")
    .transform((value) => value.replace(/\s+/g, " "))
    .refine((value) => value.length >= 2, "Subcategory name is required"),
});

export const updateSubCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .max(80, "Subcategory name must be under 80 characters")
    .transform((value) => value.replace(/\s+/g, " "))
    .refine((value) => value.length >= 2, "Subcategory name is required"),
});

export type CreateSubCategoryInput = z.infer<typeof createSubCategorySchema>;
export type UpdateSubCategoryInput = z.infer<typeof updateSubCategorySchema>;
