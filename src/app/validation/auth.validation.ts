import { z } from "zod";

export const userLoginSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9]{10,15}$/, "Mobile must be 10 to 15 digits"),
});

export const verifyOtpSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9]{10,15}$/, "Mobile must be 10 to 15 digits"),
  otp: z.coerce.string().trim().min(4, "OTP is required"),
});

export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
