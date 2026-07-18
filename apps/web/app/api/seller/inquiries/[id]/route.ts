import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSellerShop } from "@/lib/marketplace";

const updateSchema = z.object({
  status: z.enum(["NEW", "SEEN", "REPLIED", "CLOSED"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { seller, response } = await requireSellerShop();
  if (!seller) return response;
  const { id } = await params;

  try {
    const data = updateSchema.parse(await request.json());
    const inquiry = await prisma.marketplaceInquiry.findFirst({ where: { id, shopId: seller.shop.id } });
    if (!inquiry) return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });

    const updated = await prisma.marketplaceInquiry.update({
      where: { id },
      data,
    });

    return NextResponse.json({ inquiry: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Invalid request" }, { status: 400 });
  }
}
