import { NextRequest, NextResponse } from "next/server";
import { validateCoupon, incrementDiscountUsage } from "@/lib/voucher-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal, cartItems, customerId } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Voucher code is required" },
        { status: 400 }
      );
    }

    const result = await validateCoupon(code, cartItems || [], subtotal, customerId);

    if (result.valid && result.discountAmount) {
      // Increment usage count
      await incrementDiscountUsage(result.campaign.id);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error validating voucher:", error);
    return NextResponse.json(
      { error: "Failed to validate voucher" },
      { status: 500 }
    );
  }
}