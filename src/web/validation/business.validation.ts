import { z } from "zod";

const idLike = z
  .string()
  .refine(
    (v) =>
      /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(v) ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
    "id must be a valid id"
  );

export const reviewBusinessRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECT"], {
    message: "status must be APPROVED or REJECT",
  }),
});

export type ReviewBusinessRequestInput = z.infer<typeof reviewBusinessRequestSchema>;

export const listBusinessesQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"], {
    message: "status must be PENDING, APPROVED or REJECTED",
  }),
  categoryId: z
    .preprocess(
      (val) => (typeof val === "string" ? val.trim() : val),
      idLike.optional()
    )
    .optional(),
  search: z
    .preprocess(
      (val) => (typeof val === "string" ? val.trim() : val),
      z.string().max(120).optional()
    )
    .optional(),
});

export type ListBusinessesQuery = z.infer<typeof listBusinessesQuerySchema>;

export const businessIdParamSchema = z.object({
  businessId: idLike,
});
