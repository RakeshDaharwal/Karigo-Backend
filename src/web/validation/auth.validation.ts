import { z } from "zod";

export const superAdminLoginSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9]{10,15}$/, "Mobile must be 10 to 15 digits"),
});

export const verifySuperAdminOtpSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9]{10,15}$/, "Mobile must be 10 to 15 digits"),
  otp: z
    .string()
    .trim()
    .min(4, "OTP is required"),
});

export type SuperAdminLoginInput = z.infer<typeof superAdminLoginSchema>;
export type VerifySuperAdminOtpInput = z.infer<typeof verifySuperAdminOtpSchema>;
