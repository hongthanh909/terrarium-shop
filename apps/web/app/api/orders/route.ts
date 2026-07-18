import { prisma } from "@/lib/prisma";
import { calculateProductUnitPrice, canAccessOrder, getCurrentCustomerId, getShippingFee } from "@/lib/order-security";
import { validateCoupon } from "@/lib/voucher-engine";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordPurchaseEvent } from "@/lib/analytics-server";

const serializeOrder = (order: any) => ({
  ...order,
  subtotal: Number(order.subtotal),
  shippingFee: Number(order.shippingFee),
  discount: Number(order.discount),
  total: Number(order.total),
  items: order.items?.map((item: any) => ({
    ...item,
    price: Number(item.price),
  })),
});

const orderItemSchema = z.object({
  productId: z.string().min(1),
  variants: z.record(z.any()).optional().default({}),
  quantity: z.number().int().positive().max(50),
  customOptions: z.record(z.any()).optional(),
});

const shippingInfoSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(1).max(30).optional(),
  email: z.string().trim().email().max(160).optional(),
  province: z.string().trim().max(120).optional(),
  district: z.string().trim().max(120).optional(),
  ward: z.string().trim().max(120).optional(),
  fullAddress: z.string().trim().max(500).optional(),
});

const createOrderSchema = z.object({
  customerId: z.string().min(1).nullable().optional(),
  items: z.array(orderItemSchema).min(1, "Order must have at least 1 item").max(30),
  shippingInfo: shippingInfoSchema.optional(),
  shippingMethod: z.enum(["GHN_STANDARD", "GHN_EXPRESS", "GRAB"]).default("GHN_STANDARD"),
  paymentMethod: z.enum(["COD", "MOMO", "BANK_TRANSFER"]).default("COD"),
  discountCode: z.string().trim().max(64).optional(),
  analytics: z.object({
    anonymousId: z.string().uuid(),
    sessionKey: z.string().uuid(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createOrderSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const currentCustomerId = await getCurrentCustomerId();
    if (validated.data.customerId && validated.data.customerId !== currentCustomerId) {
      return NextResponse.json({ error: "Invalid customer" }, { status: 403 });
    }

    const requestedItems = validated.data.items;
    const productIds = Array.from(new Set(requestedItems.map((item) => item.productId)));

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: "ACTIVE" },
      include: {
        category: true,
        variants: true,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Một số sản phẩm không tồn tại hoặc đã ngừng bán" },
        { status: 400 }
      );
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const inventoryByProduct = new Map<string, number>();
    requestedItems.forEach((item) => {
      inventoryByProduct.set(
        item.productId,
        (inventoryByProduct.get(item.productId) ?? 0) + item.quantity
      );
    });

    for (const [productId, quantity] of Array.from(inventoryByProduct.entries())) {
      const product = productMap.get(productId)!;
      if (product.inventory < quantity) {
        return NextResponse.json(
          { error: `${product.name} không đủ tồn kho` },
          { status: 409 }
        );
      }
    }

    const calculatedItems = requestedItems.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = calculateProductUnitPrice(product, item.variants);

      return {
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0] ?? "",
        categoryId: product.categoryId,
        variants: item.variants ?? {},
        quantity: item.quantity,
        price: unitPrice,
        customOptions: item.customOptions,
      };
    });

    const subtotal = calculatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let shippingFee = getShippingFee(validated.data.shippingMethod);
    let discount = 0;
    let appliedCampaign: any = null;
    const discountCode = validated.data.discountCode?.trim().toUpperCase();

    if (discountCode) {
      const voucherResult = await validateCoupon(
        discountCode,
        calculatedItems.map((item) => ({
          productId: item.productId,
          categoryId: item.categoryId,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal,
        currentCustomerId ?? undefined
      );

      if (!voucherResult.valid) {
        return NextResponse.json(
          { error: voucherResult.error || "Voucher không hợp lệ" },
          { status: 400 }
        );
      }

      appliedCampaign = voucherResult.campaign;
      if (voucherResult.isFreeShipping) {
        shippingFee = 0;
      } else {
        discount = Math.round(voucherResult.discountAmount ?? 0);
      }
    }

    const total = Math.max(0, subtotal + shippingFee - discount);
    const randomSuffix = Math.random().toString(36).substring(2, 11).padEnd(9, "0").toUpperCase();
    const orderNumber = `ORD-${Date.now()}-${randomSuffix}`;

    const order = await prisma.$transaction(async (tx) => {
      if (appliedCampaign) {
        const usageUpdated = await tx.discountCampaign.updateMany({
          where: {
            id: appliedCampaign.id,
            status: "ACTIVE",
            OR: [
              { usageLimit: null },
              { usageCount: { lt: appliedCampaign.usageLimit ?? 0 } },
            ],
          },
          data: { usageCount: { increment: 1 } },
        });

        if (usageUpdated.count !== 1) {
          throw new Error("Voucher đã hết lượt sử dụng");
        }
      }

      for (const [productId, quantity] of Array.from(inventoryByProduct.entries())) {
        const updated = await tx.product.updateMany({
          where: {
            id: productId,
            inventory: { gte: quantity },
          },
          data: { inventory: { decrement: quantity } },
        });

        if (updated.count !== 1) {
          throw new Error("Sản phẩm không đủ tồn kho");
        }
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          ...(currentCustomerId ? { customerId: currentCustomerId } : {}),
          subtotal,
          shippingFee,
          discount,
          total,
          shippingMethod: validated.data.shippingMethod,
          paymentMethod: validated.data.paymentMethod,
          status: "PENDING",
          paymentStatus: "PENDING",
        },
      });

      await tx.orderItem.createMany({
        data: calculatedItems.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          variants: JSON.stringify(item.variants ?? {}),
          quantity: item.quantity,
          price: item.price,
          customOptions: item.customOptions ? JSON.stringify(item.customOptions) : undefined,
        })),
      });

      if (validated.data.shippingInfo) {
        await tx.shippingInfo.create({
          data: {
            orderId: newOrder.id,
            ...validated.data.shippingInfo,
          },
        });
      }

      if (appliedCampaign) {
        await tx.orderDiscount.create({
          data: {
            orderId: newOrder.id,
            campaignId: appliedCampaign.id,
            discountAmount: discount,
            appliedCode: appliedCampaign.code,
          },
        });
      }

      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          items: true,
          shippingInfo: true,
          discounts: true,
        },
      });
    });

    if (order) {
      await recordPurchaseEvent({
        ...validated.data.analytics,
        customerId: currentCustomerId,
        orderId: order.id,
      });
    }

    return NextResponse.json(serializeOrder(order), { status: 201 });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const id = searchParams.get("id");
    const orderNumberProof = searchParams.get("orderNumber");

    if (id) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          items: true,
          shippingInfo: true,
          statusLogs: true,
          discounts: {
            include: { campaign: true },
          },
        },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const access = await canAccessOrder(request, order, orderNumberProof);
      if (!access.allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json(serializeOrder(order));
    }

    if (customerId) {
      const access = await canAccessOrder(
        request,
        { customerId, orderNumber: "" },
        null
      );
      if (!access.isAdmin && access.customerId !== customerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const orders = await prisma.order.findMany({
        where: { customerId },
        include: {
          items: true,
          shippingInfo: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(orders.map(serializeOrder));
    }

    return NextResponse.json({ error: "Customer ID or Order ID required" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
