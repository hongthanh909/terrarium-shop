import { PrismaClient, DiscountType, DiscountApplicableTo } from "@prisma/client";

const prisma = new PrismaClient();

export interface ValidationResult {
  valid: boolean;
  error?: string;
  discountAmount?: number;
  campaign?: any;
}

export interface CartItem {
  productId: string;
  categoryId: string;
  price: number;
  quantity: number;
}

/**
 * Validate and calculate discount for a coupon code
 */
export async function validateCoupon(
  code: string,
  cartItems: CartItem[],
  subtotal: number,
  customerId?: string
): Promise<ValidationResult> {
  // Find campaign by code
  const campaign = await prisma.discountCampaign.findUnique({
    where: { code },
    include: { applicables: true },
  });

  if (!campaign) {
    return { valid: false, error: "Invalid discount code" };
  }

  // Check campaign status
  if (campaign.status !== "ACTIVE") {
    return { valid: false, error: "Discount code is not active" };
  }

  // Check if campaign has started
  if (campaign.startsAt && new Date(campaign.startsAt) > new Date()) {
    return { valid: false, error: "Discount code has not started yet" };
  }

  // Check if campaign has expired
  if (campaign.expiresAt && new Date(campaign.expiresAt) < new Date()) {
    return { valid: false, error: "Discount code has expired" };
  }

  // Check usage limit
  if (campaign.usageLimit && campaign.usageCount >= campaign.usageLimit) {
    return { valid: false, error: "Discount code has reached its usage limit" };
  }

  // Check minimum order amount
  if (campaign.minOrderAmount && subtotal < Number(campaign.minOrderAmount)) {
    return {
      valid: false,
      error: `Minimum order amount is ${Number(campaign.minOrderAmount).toLocaleString("vi-VN")}₫`,
    };
  }

  // Check if cart qualifies for the discount based on applicableTo
  const discountAmount = calculateDiscountAmount(
    campaign,
    cartItems,
    subtotal
  );

  if (discountAmount <= 0) {
    return {
      valid: false,
      error: "Discount code does not apply to items in your cart",
    };
  }

  return {
    valid: true,
    discountAmount,
    campaign,
  };
}

/**
 * Calculate discount amount based on campaign type and cart items
 */
function calculateDiscountAmount(
  campaign: any,
  cartItems: CartItem[],
  subtotal: number
): number {
  let discountAmount = 0;

  switch (campaign.type) {
    case DiscountType.PERCENTAGE:
      discountAmount = subtotal * (Number(campaign.value) / 100);
      break;

    case DiscountType.FIXED:
      discountAmount = Number(campaign.value);
      break;

    case DiscountType.FREE_SHIPPING:
      // Free shipping discount - handled separately
      discountAmount = 0;
      break;
  }

  // Apply max discount cap
  if (campaign.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, Number(campaign.maxDiscountAmount));
  }

  // Check if discount applies to cart items based on applicableTo
  if (campaign.applicableTo !== DiscountApplicableTo.ALL) {
    let applicableSubtotal = 0;

    switch (campaign.applicableTo) {
      case DiscountApplicableTo.CATEGORIES:
        // Only apply discount to items in specified categories
        const applicableCategoryIds = campaign.applicables
          .filter((a: any) => a.targetType === "CATEGORY")
          .map((a: any) => a.targetId);
        applicableSubtotal = cartItems
          .filter((item) => applicableCategoryIds.includes(item.categoryId))
          .reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
        break;

      case DiscountApplicableTo.PRODUCTS:
        // Only apply discount to specified products
        const applicableProductIds = campaign.applicables
          .filter((a: any) => a.targetType === "PRODUCT")
          .map((a: any) => a.targetId);
        applicableSubtotal = cartItems
          .filter((item) => applicableProductIds.includes(item.productId))
          .reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
        break;

      case DiscountApplicableTo.COMBOS:
        // Only apply discount to combo items
        // This would need combo data from cart
        applicableSubtotal = 0;
        break;
    }

    // Recalculate discount based on applicable subtotal
    if (campaign.applicableTo === DiscountApplicableTo.CATEGORIES) {
      switch (campaign.type) {
        case DiscountType.PERCENTAGE:
          discountAmount = applicableSubtotal * (Number(campaign.value) / 100);
          if (campaign.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, Number(campaign.maxDiscountAmount));
          }
          break;
        case DiscountType.FIXED:
          discountAmount = applicableSubtotal >= Number(campaign.value)
            ? Number(campaign.value)
            : applicableSubtotal;
          break;
      }
    } else if (campaign.applicableTo === DiscountApplicableTo.PRODUCTS) {
      switch (campaign.type) {
        case DiscountType.PERCENTAGE:
          discountAmount = applicableSubtotal * (Number(campaign.value) / 100);
          if (campaign.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, Number(campaign.maxDiscountAmount));
          }
          break;
        case DiscountType.FIXED:
          discountAmount = applicableSubtotal >= Number(campaign.value)
            ? Number(campaign.value)
            : applicableSubtotal;
          break;
      }
    }
  }

  // Ensure discount doesn't exceed subtotal
  return Math.min(discountAmount, subtotal);
}

/**
 * Increment usage count after successful discount application
 */
export async function incrementDiscountUsage(campaignId: string): Promise<void> {
  await prisma.discountCampaign.update({
    where: { id: campaignId },
    data: {
      usageCount: {
        increment: 1,
      },
    },
  });
}