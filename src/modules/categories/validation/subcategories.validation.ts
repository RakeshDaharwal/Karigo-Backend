import { z } from "zod";

export const createSubCategorySchema = z.object({
  categoryId: z
    .coerce
    .number()
    .int()
    .positive("Category id must be a positive number"),
  name: z
    .string()
    .trim()
    .max(80, "Subcategory name must be under 80 characters")
    .transform((value) => value.replace(/\s+/g, " "))
    .refine((value) => value.length >= 2, "Subcategory name is required"),
});

export type CreateSubCategoryInput = z.infer<typeof createSubCategorySchema>;
