import { prisma } from "@/lib/prisma";

// String constants matching DB values (no Prisma enum exists for these)
const DiscountType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED: "FIXED",
  FREE_SHIPPING: "FREE_SHIPPING",
} as const;

const DiscountApplicableTo = {
  ALL: "ALL",
  CATEGORIES: "CATEGORIES",
  PRODUCTS: "PRODUCTS",
  COMBOS: "COMBOS",
} as const;


export interface ValidationResult {
  valid: boolean;
  error?: string;
  discountAmount?: number;
  isFreeShipping?: boolean;
  campaign?: any;
  approvalClaimId?: string;
  discountCodeId?: string;
  discountCodeUsageLimit?: number | null;
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
  // A private code takes precedence over the legacy campaign code.
  const [privateCode, legacyCampaign] = await Promise.all([
    prisma.discountCode.findUnique({
      where: { code },
      include: { campaign: { include: { applicables: true } } },
    }),
    prisma.discountCampaign.findUnique({
      where: { code },
      include: {
        applicables: true,
        discountCodes: { select: { id: true }, take: 1 },
      },
    }),
  ]);
  const campaign = privateCode?.campaign ?? legacyCampaign;

  if (!campaign) {
    return { valid: false, error: "Invalid discount code" };
  }

  if (!privateCode && legacyCampaign?.discountCodes.length) {
    return { valid: false, error: "Voucher này chỉ dùng bằng mã riêng được cung cấp" };
  }

  if (privateCode) {
    if (privateCode.status !== "ACTIVE") {
      return { valid: false, error: "Mã giảm giá này không còn hoạt động" };
    }

    if (privateCode.usageLimit != null && privateCode.usageCount >= privateCode.usageLimit) {
      return { valid: false, error: "Mã giảm giá này đã hết lượt sử dụng" };
    }
  }

  // Check campaign status
  if (campaign.status !== "ACTIVE" || campaign.deletedAt) {
    return { valid: false, error: "Mã giảm giá chưa được kích hoạt" };
  }

  // Check if campaign has started — compare timestamps in ms to avoid timezone issues
  const now = Date.now();
  if (campaign.startsAt && new Date(campaign.startsAt).getTime() > now) {
    const startDate = new Date(campaign.startsAt).toLocaleDateString("vi-VN");
    return { valid: false, error: `Mã giảm giá có hiệu lực từ ngày ${startDate}` };
  }

  // Check if campaign has expired
  if (campaign.expiresAt && new Date(campaign.expiresAt).getTime() < now) {
    return { valid: false, error: "Mã giảm giá đã hết hạn" };
  }

  // Check usage limit
  if (campaign.usageLimit && campaign.usageCount >= campaign.usageLimit) {
    return { valid: false, error: "Mã giảm giá đã đạt giới hạn sử dụng" };
  }

  let approvalClaimId: string | undefined;
  if (campaign.requiresApproval) {
    if (!customerId) {
      return { valid: false, error: "Vui lòng đăng nhập để sử dụng voucher này" };
    }
    const claim = await prisma.facebookVoucherClaim.findFirst({
      where: {
        customerId,
        campaignId: campaign.id,
        status: "APPROVED",
        redeemedAt: null,
      },
      select: { id: true },
    });
    if (!claim) {
      return { valid: false, error: "Voucher này cần được admin duyệt cho tài khoản của bạn" };
    }
    approvalClaimId = claim.id;
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

  // Handle FREE_SHIPPING separately — discount amount = 0 but valid
  if (campaign.type === DiscountType.FREE_SHIPPING) {
    return {
      valid: true,
      discountAmount: 0,
      isFreeShipping: true,
      campaign,
      approvalClaimId,
      discountCodeId: privateCode?.id,
      discountCodeUsageLimit: privateCode?.usageLimit,
    };
  }

  return {
    valid: true,
    discountAmount,
    isFreeShipping: false,
    campaign,
    approvalClaimId,
    discountCodeId: privateCode?.id,
    discountCodeUsageLimit: privateCode?.usageLimit,
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
      // Handled separately above — don't fall through to discountAmount = 0
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
