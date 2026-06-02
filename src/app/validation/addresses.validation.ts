import { z } from "zod";

const trim = (val: unknown) => (typeof val === "string" ? val.trim() : val);

export const ADDRESS_TYPE_VALUES = ["HOME", "WORK", "OTHER"] as const;

export const createAddressSchema = z.object({
  name: z.preprocess(
    trim,
    z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(80, "Name is too long")
  ),
  contactNumber: z.preprocess(
    trim,
    z
      .string()
      .min(7, "Contact number is required")
      .max(20, "Contact number is too long")
      .regex(/^[0-9+\-\s()]+$/, "Contact number is invalid")
  ),
  houseNo: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().max(80, "House no is too long").optional().nullable()
  ),
  addressLine: z.preprocess(
    trim,
    z
      .string()
      .min(5, "Address line must be at least 5 characters")
      .max(300, "Address line is too long")
  ),
  addressType: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toUpperCase() : val),
    z.enum(ADDRESS_TYPE_VALUES, {
      message: "Address type must be HOME, WORK or OTHER",
    })
  ),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
