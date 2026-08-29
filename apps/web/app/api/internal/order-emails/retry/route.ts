import { NextRequest, NextResponse } from "next/server";
import { dispatchPendingOrderEmails } from "@/lib/order-notifications";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.ORDER_EMAIL_CRON_SECRET || process.env.ANALYTICS_CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Order email retry is not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await dispatchPendingOrderEmails(25);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Order email retry failed:", error);
    return NextResponse.json({ error: "Order email retry failed" }, { status: 500 });
  }
}
