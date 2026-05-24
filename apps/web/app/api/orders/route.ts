import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      items,
      shippingInfo,
      shippingMethod = "GHN_STANDARD",
      paymentMethod = "COD",
      subtotal,
      shippingFee,
      discount = 0,
      total,
    } = body;

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          subtotal: parseFloat(subtotal),
          shippingFee: parseFloat(shippingFee),
          discount: parseFloat(discount),
          total: parseFloat(total),
          shippingMethod,
          paymentMethod,
          status: "PENDING",
          paymentStatus: paymentMethod === "COD" ? "PENDING" : "PAID",
        },
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
          customOptions: item.customOptions ? JSON.stringify(item.customOptions) : null,
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
          const pointsEarned = Math.floor(parseFloat(total) / 100000); // 1 point per 100k VND

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

      return NextResponse.json(order);
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

      return NextResponse.json(orders);
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