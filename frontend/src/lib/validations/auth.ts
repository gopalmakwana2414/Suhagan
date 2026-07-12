import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(3, "Full Name must be at least 3 characters"),

    email: z
      .string()
      .email("Invalid email address"),

    mobile: z
      .string()
      .regex(
        /^(?:\+91|91|0)?[6-9]\d{9}$/,
        "Invalid Indian mobile number. Must be a 10-digit number starting with 6-9"
      ),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character"
      ),

    confirmPassword: z
      .string()
      .min(8, "Confirm password is required"),

    houseNumber: z
      .string()
      .min(1, "House Number / Flat Number is required"),

    street: z
      .string()
      .min(1, "Street / Area is required"),

    landmark: z
      .string()
      .optional()
      .or(z.literal("")),

    city: z
      .string()
      .min(1, "City is required"),

    state: z
      .string()
      .min(1, "State is required"),

    country: z
      .string()
      .min(1, "Country is required"),

    postalCode: z
      .string()
      .min(1, "Postal Code / PIN Code is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });


export const loginSchema = z.object({
  email: z
    .email("Invalid email address"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),

    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData =
  z.infer<typeof registerSchema>;

export type LoginFormData =
  z.infer<typeof loginSchema>;

export type ForgotPasswordFormData =
  z.infer<typeof forgotPasswordSchema>;

export type ResetPasswordFormData =
  z.infer<typeof resetPasswordSchema>;