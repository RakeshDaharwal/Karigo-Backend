import { z } from "zod";

const trimString = (val: unknown) => (typeof val === "string" ? val.trim() : val);

const optionalNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  const num = Number(val);
  return Number.isFinite(num) ? num : undefined;
}, z.number().min(0).optional());

export const propertyTypeSchema = z.enum([
  "ROOM",
  "PG",
  "FLAT",
  "HOUSE",
  "OFFICE",
  "SHOP",
]);

export const listHouseSchema = z.object({
  title: z.preprocess(
    trimString,
    z.string().min(2, "Property title is required").max(120)
  ),
  propertyType: propertyTypeSchema,
  houseType: z.preprocess(
    trimString,
    z.string().max(20).optional().or(z.literal(""))
  ),
  description: z.preprocess(
    trimString,
    z.string().max(1000).optional().or(z.literal(""))
  ),
  monthlyRent: z.preprocess(
    (val) => Number(val),
    z.number().positive("Monthly rent is required")
  ),
  securityDeposit: optionalNumber,
  maintenanceCharges: optionalNumber,
  ownerName: z.preprocess(
    trimString,
    z.string().max(120).optional().or(z.literal(""))
  ),
  mobileNumber: z.preprocess(
    trimString,
    z
      .string()
      .max(20)
      .regex(/^[0-9+\-\s()]*$/, "Mobile number is invalid")
      .optional()
      .or(z.literal(""))
  ),
});

export type ListHouseInput = z.infer<typeof listHouseSchema>;

export const nearbyListingsBodySchema = z.object({
  latitude: z.number().refine((v) => v >= -90 && v <= 90),
  longitude: z.number().refine((v) => v >= -180 && v <= 180),
});

export type NearbyListingsBody = z.infer<typeof nearbyListingsBodySchema>;
