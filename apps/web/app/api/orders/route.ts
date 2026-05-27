import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// Helper: normalize number | string → number
const toNum = (v: number | string): number =>
  typeof v === "number" ? v : parseFloat(v);

// Helper: serialize order Decimal fields to number
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

import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productImage: z.string(),
  variants: z.any().optional(),
  quantity: z.number().int().positive(),
  price: z.number().or(z.string()),
  customOptions: z.any().optional(),
});

const createOrderSchema = z.object({
  customerId: z.string().min(1).nullable().optional(),
  items: z.array(orderItemSchema).min(1, "Order must have at least 1 item"),
  shippingInfo: z.any().optional(),
  shippingMethod: z.enum(["GHN_STANDARD", "GHN_EXPRESS", "GRAB"]).default("GHN_STANDARD"),
  paymentMethod: z.enum(["COD", "MOMO", "BANK_TRANSFER"]).default("COD"),
  subtotal: z.number().or(z.string()),
  shippingFee: z.number().or(z.string()),
  discount: z.number().or(z.string()).default(0),
  total: z.number().or(z.string()),
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

    const {
      customerId,
      items,
      shippingInfo,
      shippingMethod,
      paymentMethod,
      subtotal,
      shippingFee,
      discount,
      total,
    } = validated.data;


    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          ...(customerId ? { customerId } : {}),
          subtotal: toNum(subtotal),
          shippingFee: toNum(shippingFee),
          discount: toNum(discount),
          total: toNum(total),
          shippingMethod,
          paymentMethod,
          status: "PENDING",
          // BANK_TRANSFER = PENDING (chờ PayOS webhook xác nhận), COD = PENDING (trả khi nhận)
          paymentStatus: "PENDING",
        } as any,
      });

      // Create order items
      await tx.orderItem.createMany({
        data: items.map((item: any) => ({
          orderId: newOrder.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          variants: JSON.stringify(item.variants || {}),
          quantity: item.quantity,
          price: parseFloat(item.price),
          customOptions: item.customOptions ? JSON.stringify(item.customOptions) : undefined,
        })),
      });

      // Create shipping info
      if (shippingInfo) {
        await tx.shippingInfo.create({
          data: {
            orderId: newOrder.id,
            ...shippingInfo,
          },
        });
      }

      // Update customer loyalty points if they made a purchase
      if (customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: customerId },
        });

        if (customer) {
          const pointsEarned = Math.floor(toNum(total) / 100000); // 1 point per 100k VND

          await tx.customer.update({
            where: { id: customerId },
            data: {
              loyaltyPoints: {
                increment: pointsEarned,
              },
            },
          });

          // Record loyalty points history
          await tx.loyaltyPoint.create({
            data: {
              customerId,
              points: pointsEarned,
              source: "ORDER",
              orderId: newOrder.id,
            },
          });
        }
      }

      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          items: true,
          shippingInfo: true,
        },
      });
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const id = searchParams.get("id");

    if (id) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
          shippingInfo: true,
          statusLogs: true,
          discounts: {
            include: {
              campaign: true,
            },
          },
        },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      return NextResponse.json(serializeOrder(order));
    }

    if (customerId) {
      const orders = await prisma.order.findMany({
        where: { customerId },
        include: {
          items: true,
          shippingInfo: true,
        },
        orderBy: {
          createdAt: "desc",
        },
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