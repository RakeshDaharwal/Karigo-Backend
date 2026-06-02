import { z } from "zod";

const removeWhitespace = (value: string) => value.replace(/\s+/g, "");

// Accepts DD/MM/YYYY or YYYY-MM-DD and returns a Date in UTC at 00:00.
// Rejects future dates and dates older than 120 years.
const parseDateOfBirth = (raw: string) => {
  const trimmed = raw.trim();
  let year: number;
  let month: number;
  let day: number;

  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (dmy) {
    day = Number(dmy[1]);
    month = Number(dmy[2]);
    year = Number(dmy[3]);
  } else if (ymd) {
    year = Number(ymd[1]);
    month = Number(ymd[2]);
    day = Number(ymd[3]);
  } else {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const now = new Date();
  if (date.getTime() > now.getTime()) {
    return null;
  }
  const minYear = now.getUTCFullYear() - 120;
  if (year < minYear) {
    return null;
  }
  return date;
};

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
  dateOfBirth: z
    .preprocess(
      (val) => {
        if (val === undefined || val === null) {
          return undefined;
        }
        if (typeof val === "string" && val.trim() === "") {
          return undefined;
        }
        return val;
      },
      z
        .string()
        .refine((v) => parseDateOfBirth(v) !== null, {
          message: "Date of birth must be a valid DD/MM/YYYY date",
        })
        .transform((v) => parseDateOfBirth(v) as Date)
        .optional()
    ),
});

export type UploadProfileInput = z.infer<typeof uploadProfileSchema>;

export const joinProfessionalSchema = z.object({
  categoryId: z
    .string()
    .transform(removeWhitespace)
    .pipe(z.string().min(1, "Category is required")),
  experienceYears: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") {
        return undefined;
      }
      if (typeof val === "string") {
        const n = Number(val.trim());
        return Number.isFinite(n) ? n : val;
      }
      return val;
    },
    z
      .number({ message: "Experience is required" })
      .int("Experience must be a whole number")
      .min(1, "Experience must be at least 1 year")
      .max(20, "Experience must be 20 years or less")
  ),
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
