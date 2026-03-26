import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  gender: z.string().trim().min(1, "Gender is required"),
  dateOfBirth: z.string().trim().optional(),
  country: z.string().trim().min(1, "Country is required"),
  state: z.string().trim().min(1, "State is required"),
  district: z.string().trim().min(1, "District is required"),
  branch: z.string().trim().min(1, "Branch is required"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
