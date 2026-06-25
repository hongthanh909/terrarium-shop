import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getPayOSClient, isExpiredBankTransfer, markOrderPaid } from "@/lib/order-security";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    message: "Payment webhook endpoint",
    status: "active",
  });
}

async function handlePayOSWebhook(body: any) {
  const payos = await getPayOSClient();
  const webhookData = await payos.webhooks.verify(body);

  if (!body.success || webhookData.code !== "00") {
    return NextResponse.json({ received: true });
  }

  const statusLog = await prisma.orderStatusLog.findFirst({
    where: { note: `PayOS OrderCode: ${webhookData.orderCode}` },
    include: { order: true },
    orderBy: { createdAt: "desc" },
  });

  const order = statusLog?.order;
  if (!order || order.paymentMethod !== "BANK_TRANSFER" || order.paymentStatus !== "PENDING") {
    return NextResponse.json({ received: true });
  }

  if (isExpiredBankTransfer(order)) {
    return NextResponse.json({ received: true });
  }

  if (Number(webhookData.amount) < Number(order.total)) {
    await prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        status: order.status,
        note: `PayOS payment ignored: amount ${webhookData.amount} is less than order total ${Number(order.total)}`,
      },
    });
    return NextResponse.json({ received: true });
  }

  await markOrderPaid(
    order.id,
    `Thanh toán thành công qua PayOS: ${Number(webhookData.amount).toLocaleString("vi-VN")}đ`
  );

  return NextResponse.json({ received: true });
}

async function handleSePayWebhook(req: NextRequest, body: any) {
  const authHeader = req.headers.get("authorization") || "";
  const secret = process.env.SEPAY_WEBHOOK_SECRET || "";

  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 500 });
  }

  if (secret && !authHeader.includes(secret)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (body.transferType !== "in") {
    return NextResponse.json({ received: true });
  }

  const content = String(body.content || body.description || "").toUpperCase();
  const amount = Number(body.transferAmount || 0);
  const match = content.match(/TT\s*([A-Z0-9]{4,})/);

  if (!match || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ received: true });
  }

  const codeFragment = match[1];
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: { endsWith: codeFragment },
      paymentMethod: "BANK_TRANSFER",
      paymentStatus: "PENDING",
    },
  });

  if (!order || isExpiredBankTransfer(order)) {
    return NextResponse.json({ received: true });
  }

  if (amount < Number(order.total)) {
    await prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        status: order.status,
        note: `SePay payment ignored: amount ${amount} is less than order total ${Number(order.total)}`,
      },
    });
    return NextResponse.json({ received: true });
  }

  await markOrderPaid(
    order.id,
    `Thanh toán thành công qua SePay: ${amount.toLocaleString("vi-VN")}đ`
  );

  return NextResponse.json({ received: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body?.signature && body?.data) {
      return handlePayOSWebhook(body);
    }

    return handleSePayWebhook(req, body);
  } catch (error: any) {
    console.error("[Payment Webhook] Error:", error?.message || error);
    return NextResponse.json({ received: true });
  }
}
