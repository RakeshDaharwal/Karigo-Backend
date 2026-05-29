import { z } from "zod";

const removeWhitespace = (value: string) => value.replace(/\s+/g, "");

export const uploadProfileSchema = z.object({
  firstName: z
    .string()
    .transform(removeWhitespace)
    .pipe(z.string().min(1, "First name is required")),
  lastName: z
    .string()
    .transform(removeWhitespace)
    .pipe(z.string().min(1, "Last name is required")),
  gender: z
    .string()
    .transform(removeWhitespace)
    .pipe(z.string().min(1, "Gender is required")),
});

export type UploadProfileInput = z.infer<typeof uploadProfileSchema>;

export const joinProfessionalSchema = z
  .object({
    categoryId: z
      .string()
      .transform(removeWhitespace)
      .pipe(z.string().min(1, "Category is required")),
    subCategoryIds: z.preprocess(
      (val) => {
        if (val === undefined || val === null) {
          return [];
        }
        if (typeof val === "string") {
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return val;
      },
      z.array(z.string().min(1)).min(1, "Select at least one skill")
    ),
    partnerType: z
      .preprocess(
        (val) =>
          typeof val === "string" ? val.trim().toUpperCase() : val,
        z.enum(["INDIVIDUAL", "BUSINESS"], {
          message: "Partner type must be INDIVIDUAL or BUSINESS",
        })
      ),
    businessName: z
      .preprocess(
        (val) => (typeof val === "string" ? val.trim() : val),
        z.string().max(120, "Business name must be under 120 characters").optional()
      )
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.partnerType === "BUSINESS") {
      const name = data.businessName?.trim();
      if (!name || name.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["businessName"],
          message: "Business name is required when partner type is Business",
        });
      }
    }
  });

export type JoinProfessionalInput = z.infer<typeof joinProfessionalSchema>;

export const autocompletePlacesQuerySchema = z.object({
  text: z
    .string()
    .transform(removeWhitespace)
    .pipe(z.string().min(2, "Type at least 2 characters")),
});

export type AutocompletePlacesQuery = z.infer<typeof autocompletePlacesQuerySchema>;

export const updateBranchSchema = z.object({
  name: z
    .string()
    .transform(removeWhitespace)
    .pipe(z.string().min(1, "Branch name is required")),
  latitude: z.number().refine((v) => v >= -90 && v <= 90, {
    message: "latitude must be between -90 and 90",
  }),
  longitude: z.number().refine((v) => v >= -180 && v <= 180, {
    message: "longitude must be between -180 and 180",
  }),
});

export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
