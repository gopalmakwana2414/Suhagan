import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),

  sku: z.string().min(2, "SKU must be at least 2 characters"),

  category: z.string().min(1, "Please select a category"),

  originalPrice: z.coerce.number().min(1, "Original price is required"),

  salePrice: z.coerce.number().min(1, "Sale price is required"),

  stock: z.coerce.number().min(0, "Stock cannot be negative"),

  fabric: z.string().min(1, "Fabric is required"),

  color: z.string().min(1, "Color is required"),

  occasion: z.string().min(1, "Occasion is required"),

  blouseIncluded: z.coerce.boolean().default(false),

  featured: z.coerce.boolean().default(false),

  bestseller: z.coerce.boolean().default(false),

  newArrival: z.coerce.boolean().default(false),

  shortDescription: z
    .string()
    .min(10, "Short description must be at least 10 characters")
    .max(200, "Keep it under 200 characters"),

  description: z.string().min(20, "Description must be at least 20 characters"),

  metaTitle: z.string().optional(),

  metaDescription: z.string().optional(),
}).refine((data) => data.salePrice <= data.originalPrice, {
  message: "Sale price cannot exceed original price",
  path: ["salePrice"],
});

export type ProductFormData = z.infer<typeof productSchema>;
export type ProductFormInput = z.input<typeof productSchema>;
