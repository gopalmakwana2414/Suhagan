import { z } from "zod";

// Validator for regular User Login with CAPTCHA
export const userLoginSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  captchaId: z.string().trim().min(1, "Captcha ID is required"),
  captchaText: z
    .string()
    .trim()
    .length(6, "Captcha must be exactly 6 characters")
    .regex(/^[A-Z0-9]+$/, "Captcha must contain only uppercase letters and numbers"),
});

// Validator for Admin Send OTP request
export const adminSendOtpSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Validator for Admin Login request with OTP
export const adminLoginSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  otp: z
    .string()
    .trim()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});
