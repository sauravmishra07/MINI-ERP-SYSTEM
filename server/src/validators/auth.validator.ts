import { z } from "zod";

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || "@k95foods.com";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .refine((e) => e.endsWith(ALLOWED_DOMAIN), {
      message: `Only ${ALLOWED_DOMAIN} email addresses are allowed`,
    }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).default("EMPLOYEE"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]),
});
