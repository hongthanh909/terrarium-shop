import { z } from "zod";

// Shared schemas
export const categoryStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const productStatusSchema = z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK"]);
export const productTypeSchema = z.enum(["PRODUCT", "COMBO", "CUSTOM_BUILDER"]);

// Categories Validation
export const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  metaDescription: z.string().max(500).optional().nullable(),
  parentId: z.string().optional().nullable(),
  status: categoryStatusSchema.optional().default("ACTIVE"),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().optional(), // In case it's passed in body, though usually in path param
});

// Products Validation
const variantOptionSchema = z.object({
  variantType: z.string().min(1),
  options: z.array(z.string().min(1)).min(1, "At least one option is required"),
  image: z.string().url().optional(),
});

export const careGuideSchema = z.object({
  watering: z.string().optional().default(""),
  sunlight: z.string().optional().default(""),
  temperature: z.string().optional().default(""),
  humidity: z.string().optional().default(""),
  commonIssues: z.string().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
});

export const createProductSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Invalid slug format"),
  description: z.string().optional().nullable(),
  basePrice: z.number().or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
  compareAtPrice: z.number().or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)).optional().nullable(),
  salePrice: z.number().or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)).optional().nullable(),
  saleEndDate: z.string().optional().nullable(),
  packageOptionsEnabled: z.boolean().optional().default(true),
  standardPackageAdjustment: z.number().min(0).or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)).optional().default(100000),
  advancedPackageAdjustment: z.number().min(0).or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)).optional().default(120000),
  inventory: z.number().int().min(0).default(0),
  type: productTypeSchema.optional().default("PRODUCT"),
  status: z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"]).optional().default("DRAFT"),
  categoryId: z.string().optional().nullable(),
  isFeatured: z.boolean().optional().default(false),
  images: z.array(z.string().url("Must be a valid URL")).min(1, "At least one image is required"),
  variants: z.array(z.any()).optional(),
  variantOptions: z.array(variantOptionSchema).optional(),
  careGuideData: careGuideSchema.optional().nullable(),
  size: z.string().optional().nullable(),
  soil: z.string().optional().nullable(),
  moss: z.string().optional().nullable(),
  driftwood: z.string().optional().nullable(),
  accessories: z.string().optional().nullable(),
  setupStatus: z.enum(["READY_TO_DISPLAY", "DIY_KIT", "CUSTOM_ORDER"]).optional().nullable(),
  careLevel: z.enum(["EASY", "MEDIUM", "ADVANCED"]).optional().nullable(),
  chatTags: z.array(z.string().trim().min(1)).optional().default([]),
  shortConsultNote: z.string().max(500).optional().nullable(),
  displayRating: z.number().min(0).max(5).optional().nullable(),
  displayReviewCount: z.number().int().min(0).optional().default(0),
});

export const updateProductSchema = createProductSchema.partial();
