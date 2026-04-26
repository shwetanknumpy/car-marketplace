import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["BUYER", "SELLER"]).default("BUYER"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  brand: z.string().min(1, "Brand is required").max(100),
  model: z.string().min(1, "Model is required").max(100),
  year: z
    .number()
    .int()
    .min(1900, "Year must be 1900 or later")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  mileage: z.number().int().min(0, "Mileage cannot be negative"),
  price: z.number().positive("Price must be positive").max(10000000),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(5000),
  status: z.enum(["ACTIVE", "SOLD", "DRAFT"]).default("ACTIVE"),
  images: z.array(z.string().url()).min(1, "At least one image is required").max(6),
});

export const inquirySchema = z.object({
  message: z
    .string()
    .min(20, "Message must be at least 20 characters")
    .max(1000),
  listingId: z.string().cuid(),
});

export const listingFilterSchema = z.object({
  brand: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minYear: z.number().optional(),
  maxYear: z.number().optional(),
  maxMileage: z.number().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(12),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type InquiryInput = z.infer<typeof inquirySchema>;
export type ListingFilterInput = z.infer<typeof listingFilterSchema>;
