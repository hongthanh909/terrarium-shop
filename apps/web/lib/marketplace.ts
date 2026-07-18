import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const shopApplicationSchema = z.object({
  shopName: z.string().trim().min(2).max(100),
  shopSlug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  ownerName: z.string().trim().min(2).max(100),
  ownerIdNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{9,12}$/, "CCCD/CMND phai gom 9 den 12 chu so."),
  zaloUrl: z.string().trim().url().optional().nullable(),
  address: z.string().trim().max(250).optional().nullable(),
  province: z.string().trim().max(80).optional().nullable(),
  district: z.string().trim().max(80).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
  commitmentAccepted: z.literal(true),
});

export const shopProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(1200).optional().nullable(),
  logoUrl: z.string().trim().url().optional().nullable(),
  bannerUrl: z.string().trim().url().optional().nullable(),
  phone: z.string().trim().min(8).max(20).optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  zaloUrl: z.string().trim().url().optional().nullable(),
  facebookUrl: z.string().trim().url().optional().nullable(),
  address: z.string().trim().max(250).optional().nullable(),
  province: z.string().trim().max(80).optional().nullable(),
  district: z.string().trim().max(80).optional().nullable(),
});

export const marketplaceProductSchema = z.object({
  title: z.string().trim().min(2).max(140),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  categoryId: z.string().trim().optional().nullable(),
  description: z.string().trim().min(20).max(4000),
  price: z.coerce.number().min(0).max(999_999_999),
  priceNote: z.string().trim().max(200).optional().nullable(),
  images: z.array(z.string().url()).max(8).default([]),
  videoUrl: z.string().trim().url().optional().nullable(),
  condition: z.string().trim().max(80).optional().nullable(),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
  province: z.string().trim().max(80).optional().nullable(),
  district: z.string().trim().max(80).optional().nullable(),
  categoryIds: z.array(z.string().trim().min(1)).max(2).optional().default([]),
});

export const marketplaceCategorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  icon: z.enum(["mini", "medium", "large", "tank", "sale", "accessory", "tag"]).default("tag"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().optional().default(true),
});

export const marketplaceInquirySchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().max(20).optional().nullable(),
    email: z.string().trim().email().optional().nullable(),
    offerPrice: z.coerce.number().min(0).max(999_999_999).optional().nullable(),
    message: z.string().trim().min(10).max(1000),
  })
  .refine((data) => Boolean(data.phone || data.email), {
    message: "Vui long de lai so dien thoai hoac email.",
    path: ["phone"],
  });

export const adminShopReviewSchema = z.object({
  note: z.string().trim().max(1000).optional().nullable(),
});

export const policyViolationSchema = z.object({
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  reason: z.string().trim().min(5).max(1000),
  evidence: z.string().trim().max(2000).optional().nullable(),
  action: z
    .enum(["WARNING", "TEMP_SUSPEND", "PERMANENT_BAN", "ACCOUNT_DELETE_REQUESTED"])
    .default("WARNING"),
  productId: z.string().trim().optional().nullable(),
});

const blockedKeywords = [
  "ma tuy",
  "can sa",
  "vu khi",
  "sung",
  "dao bam",
  "hang gia",
  "lua dao",
  "18+",
  "nguoi lon",
  "crypto",
  "tai khoan game",
];

const terrariumKeywords = [
  "terrarium",
  "reuu",
  "reu",
  "moss",
  "cay",
  "chau",
  "binh thuy tinh",
  "dat",
  "soi",
  "lua",
  "phu kien",
  "dung cu",
  "den",
  "suong",
  "tieu canh",
];

export function moderateMarketplaceProduct(input: { title: string; description: string }) {
  const text = `${input.title} ${input.description}`.toLowerCase();
  const reasons: string[] = [];
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";

  const blocked = blockedKeywords.filter((keyword) => text.includes(keyword));
  if (blocked.length > 0) {
    riskLevel = "HIGH";
    reasons.push(`Tu khoa can chan: ${blocked.join(", ")}`);
  }

  const related = terrariumKeywords.some((keyword) => text.includes(keyword));
  if (!related) {
    riskLevel = riskLevel === "HIGH" ? "HIGH" : "MEDIUM";
    reasons.push("Chua thay dau hieu san pham lien quan terrarium/phu kien.");
  }

  return {
    riskLevel,
    reasons,
    isTerrariumRelated: related,
  };
}

export async function getCurrentCustomer() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id;
  if (!id) return null;

  return prisma.customer.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, phone: true, role: true },
  });
}

export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return { customer: null, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { customer, response: null };
}

export async function getCurrentSellerShop() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const shop = await prisma.shop.findFirst({
    where: {
      ownerId: customer.id,
      status: { in: ["ACTIVE", "UNDER_REVIEW", "PENDING", "SUSPENDED"] },
    },
  });

  return shop ? { customer, shop } : null;
}

export async function requireSellerShop() {
  const seller = await getCurrentSellerShop();
  if (!seller) {
    return { seller: null, response: Response.json({ error: "Seller shop required" }, { status: 403 }) };
  }
  return { seller, response: null };
}

export function serializeMarketplaceProduct(product: any) {
  return {
    ...product,
    price: product.price != null ? Number(product.price) : product.price,
    shop: product.shop
      ? {
          ...product.shop,
          platformFeeRate:
            product.shop.platformFeeRate != null ? Number(product.shop.platformFeeRate) : product.shop.platformFeeRate,
        }
      : product.shop,
  };
}
