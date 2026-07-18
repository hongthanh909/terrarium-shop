import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer, shopApplicationSchema } from "@/lib/marketplace";

export async function POST(request: Request) {
  const { customer, response } = await requireCustomer();
  if (!customer) return response;

  try {
    const body = await request.json();
    const data = shopApplicationSchema.parse(body);

    if (!customer.email || !customer.phone || !customer.name) {
      return NextResponse.json(
        { error: "Tai khoan can co email, so dien thoai va ho ten truoc khi mo shop." },
        { status: 400 }
      );
    }

    const [activeShop, pendingApplication, slugOwner] = await Promise.all([
      prisma.shop.findFirst({ where: { ownerId: customer.id, status: { in: ["ACTIVE", "UNDER_REVIEW", "PENDING"] } } }),
      prisma.shopApplication.findFirst({ where: { customerId: customer.id, status: "PENDING" } }),
      prisma.shop.findUnique({ where: { slug: data.shopSlug } }),
    ]);

    if (activeShop) {
      return NextResponse.json({ error: "Tai khoan da co shop." }, { status: 409 });
    }
    if (pendingApplication) {
      return NextResponse.json({ error: "Dang co don dang ky cho duyet." }, { status: 409 });
    }
    if (slugOwner) {
      return NextResponse.json({ error: "Slug shop da duoc su dung." }, { status: 409 });
    }

    const application = await prisma.shopApplication.create({
      data: {
        customerId: customer.id,
        shopName: data.shopName,
        shopSlug: data.shopSlug,
        ownerName: data.ownerName || customer.name,
        ownerIdNumber: data.ownerIdNumber,
        phone: customer.phone,
        email: customer.email,
        emailVerified: true,
        phoneVerified: true,
        zaloUrl: data.zaloUrl,
        address: data.address,
        province: data.province,
        district: data.district,
        description: data.description,
        commitmentAccepted: data.commitmentAccepted,
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Invalid request" }, { status: 400 });
  }
}
