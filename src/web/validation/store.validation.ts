import { z } from "zod";

const trimmed = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().max(max)
  );

const optionalTrimmed = (max: number) =>
  z.preprocess(
    (v) => {
      if (v === undefined || v === null) {
        return undefined;
      }
      if (typeof v === "string") {
        const t = v.trim();
        return t === "" ? undefined : t;
      }
      return v;
    },
    z.string().max(max).optional()
  );

// Accepts "HH:mm" 24-hour. Validates the hour/minute ranges too.
const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:mm format");

const optionalTime = z.preprocess(
  (v) => {
    if (v === undefined || v === null) {
      return undefined;
    }
    if (typeof v === "string") {
      const t = v.trim();
      return t === "" ? undefined : t;
    }
    return v;
  },
  timeOfDay.optional()
);

export const createStoreSchema = z.object({
  name: trimmed(120).pipe(z.string().min(1, "Store name is required")),
  description: optionalTrimmed(2000),
  openTime: optionalTime,
  closeTime: optionalTime,
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;

const priceFromAny = z.preprocess((v) => {
  if (typeof v === "number") {
    return v;
  }
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") {
      return undefined;
    }
    const n = Number(t);
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, z.number().nonnegative("Price must be 0 or more"));

export const createProductSchema = z.object({
  name: trimmed(180).pipe(z.string().min(1, "Product name is required")),
  description: optionalTrimmed(4000),
  price: priceFromAny,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// Multipart form values arrive as strings; coerce "true"/"1" to boolean.
const booleanish = z.preprocess((v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    if (t === "true" || t === "1" || t === "yes") return true;
    if (t === "false" || t === "0" || t === "no" || t === "") return false;
  }
  return v;
}, z.boolean().optional());

// Updates are multipart and any subset of fields is allowed (including
// image-only updates), so no global "at least one field" refine here.
export const updateProductSchema = z.object({
  name: trimmed(180).pipe(z.string().min(1, "Product name is required")).optional(),
  description: optionalTrimmed(4000),
  price: priceFromAny.optional(),
  removeImage: booleanish,
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
