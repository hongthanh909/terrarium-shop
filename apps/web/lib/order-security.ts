import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getProductPackagePriceAdjustment } from "@/lib/product-packages";

export const PAYMENT_TIMEOUT_MINUTES = 30;

export async function getCurrentCustomerId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return ((session?.user as any)?.id as string | undefined) ?? null;
}

export async function canAccessOrder(
  request: NextRequest,
  order: { customerId: string | null; orderNumber: string },
  orderNumberProof?: string | null
) {
  const admin = await verifyAdminRequest(request);
  if (admin) return { allowed: true, isAdmin: true, customerId: admin.id };

  const currentCustomerId = await getCurrentCustomerId();
  if (currentCustomerId && order.customerId === currentCustomerId) {
    return { allowed: true, isAdmin: false, customerId: currentCustomerId };
  }

  const proof = orderNumberProof?.trim();
  if (!order.customerId && proof && proof === order.orderNumber) {
    return { allowed: true, isAdmin: false, customerId: null };
  }

  return { allowed: false, isAdmin: false, customerId: currentCustomerId };
}

export function isExpiredBankTransfer(order: {
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: Date;
}) {
  if (
    order.paymentMethod !== "BANK_TRANSFER" ||
    order.paymentStatus !== "PENDING" ||
    order.status !== "PENDING"
  ) {
    return false;
  }

  const ageMs = Date.now() - new Date(order.createdAt).getTime();
  return ageMs >= PAYMENT_TIMEOUT_MINUTES * 60 * 1000;
}

export function remainingPaymentSeconds(createdAt: Date) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const remainingMs = PAYMENT_TIMEOUT_MINUTES * 60 * 1000 - ageMs;
  return Math.max(0, Math.floor(remainingMs / 1000));
}

export function getShippingFee(shippingMethod: string) {
  if (shippingMethod === "GHN_EXPRESS") return 50000;
  if (shippingMethod === "GRAB") return 60000;
  return 30000;
}

type OrderInventoryItem = {
  productId: string;
  quantity: number;
};

export async function restoreOrderInventory(
  tx: any,
  items: OrderInventoryItem[]
) {
  for (const item of items) {
    await tx.product.updateMany({
      where: { id: item.productId },
      data: { inventory: { increment: item.quantity } },
    });
  }
}

export async function reserveOrderInventory(
  tx: any,
  items: OrderInventoryItem[]
) {
  for (const item of items) {
    const updated = await tx.product.updateMany({
      where: {
        id: item.productId,
        inventory: { gte: item.quantity },
      },
      data: { inventory: { decrement: item.quantity } },
    });

    if (updated.count !== 1) {
      throw new Error("Sản phẩm không đủ tồn kho");
    }
  }
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function inferPackageAdjustment(product: any, variants: Record<string, unknown>) {
  const productText = normalizeText(
    `${product.name} ${product.slug} ${product.category?.name ?? ""} ${product.category?.slug ?? ""}`
  );
  const variantText = normalizeText(Object.values(variants).join(" "));
  const looksLikeTank =
    productText.includes(" be") ||
    productText.includes("be ") ||
    productText.includes("be-") ||
    productText.includes("bể") ||
    productText.includes("tank");

  if (!looksLikeTank) return 0;
  if (variantText.includes("advanced") || variantText.includes("nang cao")) {
    return getProductPackagePriceAdjustment("advanced");
  }
  if (variantText.includes("standard") || variantText.includes("tieu chuan")) {
    return getProductPackagePriceAdjustment("standard");
  }
  return 0;
}

export function calculateProductUnitPrice(
  product: any,
  variants: Record<string, unknown> = {}
) {
  const basePrice = Number(product.basePrice);
  const salePrice = product.salePrice == null ? null : Number(product.salePrice);
  const saleValid =
    salePrice != null &&
    salePrice < basePrice &&
    (!product.saleEndDate || new Date(product.saleEndDate) > new Date());

  let price = saleValid ? salePrice! : basePrice;

  for (const variant of product.variants ?? []) {
    const selectedValue = variants[variant.variantType];
    if (
      selectedValue &&
      normalizeText(selectedValue) === normalizeText(variant.value)
    ) {
      price += Number(variant.priceAdjustment);
    }
  }

  price += inferPackageAdjustment(product, variants);

  return Math.max(0, Math.round(price));
}

export async function getPayOSClient() {
  const { PayOS } = await import("@payos/node");
  return new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
    logLevel: "warn",
  });
}

export async function markOrderPaid(orderId: string, note: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, paymentStatus: true, status: true },
    });

    if (!order || order.paymentStatus === "PAID") return;

    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: order.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED",
      },
    });

    if (order.status !== "CANCELLED") {
      await tx.orderStatusLog.create({
        data: {
          orderId,
          status: "CONFIRMED",
          note,
        },
      });
    }
  });
}
