import { z } from "zod";

const trimString = (val: unknown) => (typeof val === "string" ? val.trim() : val);

export const vehicleTypeSchema = z.enum([
  "BIKE",
  "AUTO",
  "PICKUP",
  "MINI_TRUCK",
  "TRUCK",
  "TRACTOR",
  "JCB",
]);

export const listVehicleSchema = z.object({
  title: z.preprocess(
    trimString,
    z.string().min(2, "Vehicle title is required").max(120)
  ),
  vehicleType: vehicleTypeSchema,
  description: z.preprocess(
    trimString,
    z.string().max(1000).optional().or(z.literal(""))
  ),
});

export type ListVehicleInput = z.infer<typeof listVehicleSchema>;

export { nearbyListingsBodySchema } from "./houses.validation";
export type { NearbyListingsBody } from "./houses.validation";
