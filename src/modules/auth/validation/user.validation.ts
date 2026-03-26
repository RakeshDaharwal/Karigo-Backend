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
  dateOfBirth: z.string().transform(removeWhitespace).optional(),
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
