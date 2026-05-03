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
  dateOfBirth: z.preprocess(
    (val) => {
      if (val === undefined || val === null) {
        return undefined;
      }
      const t = removeWhitespace(String(val));
      return t === "" ? undefined : t;
    },
    z.string().optional()
  ),
  country: z
    .string()
    .transform(removeWhitespace)
    .pipe(z.string().min(1, "Country is required")),
  state: z
    .string()
    .transform(removeWhitespace)
    .pipe(z.string().min(1, "State is required")),
  district: z
    .string()
    .transform(removeWhitespace)
    .pipe(z.string().min(1, "District is required")),
  branch: z
    .string()
    .transform(removeWhitespace)
    .pipe(z.string().min(1, "Branch is required")),
});

export type UploadProfileInput = z.infer<typeof uploadProfileSchema>;

export const joinProfessionalSchema = z.object({
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
});

export type JoinProfessionalInput = z.infer<typeof joinProfessionalSchema>;
