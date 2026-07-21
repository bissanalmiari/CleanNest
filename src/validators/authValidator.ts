// Validation schemas for authentication endpoints.
// Requires zod: npm install zod
import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s()]{6,20}$/, "Invalid phone number");

// Shared password rule — mirrors changePasswordSchema in userValidator.ts
// so "strong password" means the same thing everywhere in the app.
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    phone: phoneSchema.optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
    // Registration only ever creates customers or cleaners — never admins.
    role: z.enum(["customer", "cleaner"]).optional().default("customer"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{4,8}$/, "Invalid verification code");

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    otp: otpSchema,
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  otp: otpSchema,
});

export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;
export type ResendOtpValues = z.infer<typeof resendOtpSchema>;