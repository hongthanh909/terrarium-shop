import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/voucher-engine";
import { getCurrentCustomerId } from "@/lib/order-security";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal, cartItems } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Voucher code is required" },
        { status: 400 }
      );
    }

    const customerId = await getCurrentCustomerId();
    const result = await validateCoupon(code, cartItems || [], subtotal, customerId ?? undefined);

    // NOTE: Do NOT increment usage here — only increment when order is actually placed
    // Usage is incremented in the orders API after successful payment

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error validating voucher:", error);
    return NextResponse.json(
      { error: "Failed to validate voucher" },
      { status: 500 }
    );
  }
}
