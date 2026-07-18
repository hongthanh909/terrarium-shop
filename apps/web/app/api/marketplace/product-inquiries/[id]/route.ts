import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer, marketplaceInquirySchema } from "@/lib/marketplace";
import { checkRateLimit } from "@/lib/rateLimiter";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(`marketplace-inquiry:${ip}`, 5, 10 * 60 * 1000);

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Ban dang gui lien he qua nhanh. Vui long thu lai sau.", retryAfter: rate.retryAfter },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter ?? 60) } }
    );
  }

  try {
    const data = marketplaceInquirySchema.parse(await request.json());
    const product = await prisma.marketplaceProduct.findFirst({
      where: { id, status: "ACTIVE", shop: { status: "ACTIVE" } },
      select: { id: true, shopId: true },
    });

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const customer = await getCurrentCustomer();
    const inquiry = await prisma.marketplaceInquiry.create({
      data: {
        productId: product.id,
        shopId: product.shopId,
        customerId: customer?.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        offerPrice: data.offerPrice,
        message: data.message,
      },
    });

    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Invalid request" }, { status: 400 });
  }
}
