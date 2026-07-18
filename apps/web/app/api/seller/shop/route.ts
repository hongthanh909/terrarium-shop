import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSellerShop, shopProfileSchema } from "@/lib/marketplace";

export async function GET() {
  const { seller, response } = await requireSellerShop();
  if (!seller) return response;

  return NextResponse.json({ shop: seller.shop });
}

export async function PATCH(request: Request) {
  const { seller, response } = await requireSellerShop();
  if (!seller) return response;

  try {
    const body = await request.json();
    const data = shopProfileSchema.parse(body);

    const shop = await prisma.shop.update({
      where: { id: seller.shop.id },
      data,
    });

    return NextResponse.json({ shop });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Invalid request" }, { status: 400 });
  }
}
