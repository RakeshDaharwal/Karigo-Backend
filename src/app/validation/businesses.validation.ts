import { z } from "zod";

const trimString = (val: unknown) => (typeof val === "string" ? val.trim() : val);

export const BUSINESS_CATEGORY_VALUES = [
  "FOOD",
  "GROCERY",
  "PHARMACY",
  "HEALTHCARE",
  "HARDWARE",
  "ELECTRONICS",
  "MOBILE",
  "FASHION",
  "FOOTWEAR",
  "FURNITURE",
  "BEAUTY",
  "FITNESS",
  "SPORTS",
] as const;

export const onboardBusinessSchema = z.object({
  name: z.preprocess(
    trimString,
    z
      .string()
      .min(2, "Business name must be at least 2 characters")
      .max(120, "Business name must be under 120 characters")
  ),
  description: z.preprocess(
    trimString,
    z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description must be under 500 characters")
  ),
  category: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toUpperCase() : val),
    z.enum(BUSINESS_CATEGORY_VALUES, {
      message: "Please select a valid business category",
    })
  ),
  contactPhone: z.preprocess(
    trimString,
    z
      .string()
      .min(7, "Contact phone is required")
      .max(20, "Contact phone is too long")
      .regex(/^[0-9+\-\s()]+$/, "Contact phone is invalid")
  ),
});

export type OnboardBusinessInput = z.infer<typeof onboardBusinessSchema>;

export const nearbyBusinessesBodySchema = z.object({
  latitude: z.number().refine((v) => v >= -90 && v <= 90, {
    message: "latitude must be between -90 and 90",
  }),
  longitude: z.number().refine((v) => v >= -180 && v <= 180, {
    message: "longitude must be between -180 and 180",
  }),
});

export type NearbyBusinessesBody = z.infer<typeof nearbyBusinessesBodySchema>;
