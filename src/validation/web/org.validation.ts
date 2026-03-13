import { z } from "zod";

export const orgSignUpSchema = z.object({
 name: z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .transform(val => val.replace(/\s+/g, " ")),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email format"),

  password: z
    .string()
    .trim()
    .min(6, "Password must be at least 6 characters")
    .transform(val => val.replace(/\s+/g, " ")),
});


export const orgSignInSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// 🔥 Infer Types
export type OrgSignUpInput = z.infer<typeof orgSignUpSchema>;
export type OrgSignInInput = z.infer<typeof orgSignInSchema>;