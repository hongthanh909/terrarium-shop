import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    message: "SePay Webhook endpoint — Tiệm Rêu Décor",
    status: "active",
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // ── 1. Verify HMAC-SHA256 signature from SePay ────────────────────────
    const signatureHeader = req.headers.get("X-SePay-Signature") || "";
    const secret = process.env.SEPAY_WEBHOOK_SECRET || "";

    if (secret) {
      const expected = createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      // SePay may send "sha256=<hex>" or just "<hex>"
      const received = signatureHeader.startsWith("sha256=")
        ? signatureHeader.slice(7)
        : signatureHeader;

      if (received !== expected) {
        console.error("[SePay] ❌ Invalid signature — request rejected");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    console.log("[SePay] Webhook received:", JSON.stringify(body, null, 2));

    // ── 2. Chỉ xử lý giao dịch TIỀN VÀO ─────────────────────────────────
    if (body.transferType !== "in") {
      return NextResponse.json({ received: true });
    }

    const content: string = (body.content || body.description || "").toUpperCase();
    const amount: number = Number(body.transferAmount || 0);

    console.log(`[SePay] Transfer IN — content: "${content}", amount: ${amount}`);

    // ── 3. Khớp đơn hàng từ nội dung chuyển khoản ────────────────────────
    // Format nội dung CK: "TT XXXXXXXX" (8 ký tự cuối của orderNumber)
    const match = content.match(/TT\s*([A-Z0-9]{4,})/);
    if (!match) {
      console.log("[SePay] No order code pattern found in content:", content);
      return NextResponse.json({ received: true });
    }

    const codeFragment = match[1];
    console.log("[SePay] Looking for order ending with:", codeFragment);

    // Tìm đơn hàng chưa thanh toán khớp với fragment
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: { endsWith: codeFragment },
        paymentMethod: "BANK_TRANSFER",
        paymentStatus: "PENDING",
      },
    });

    if (!order) {
      console.log("[SePay] No matching pending order for code:", codeFragment);
      return NextResponse.json({ received: true });
    }

    // ── 4. Cập nhật trạng thái đơn hàng ─────────────────────────────────
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
      },
    });

    await prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        status: "CONFIRMED",
        note: `Thanh toán thành công qua SePay — ${amount.toLocaleString("vi-VN")}đ`,
      },
    });

    console.log(`[SePay] ✅ Order ${order.orderNumber} marked PAID (${amount.toLocaleString("vi-VN")}đ)`);
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("[SePay] Webhook Error:", error?.message || error);
    // Luôn trả 200 để SePay không retry liên tục khi lỗi không liên quan
    return NextResponse.json({ received: true });
  }
}
