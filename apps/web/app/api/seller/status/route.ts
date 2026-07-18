import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/marketplace";

export async function GET() {
  const { customer, response } = await requireCustomer();
  if (!customer) return response;

  if (customer.role === "ADMIN") {
    return NextResponse.json({
      state: "ADMIN",
      label: "Quản lý",
      href: "/tiem-nho-nth24",
      description: "Tài khoản admin quản lý shop trong dashboard.",
    });
  }

  const [shop, latestApplication] = await Promise.all([
    prisma.shop.findFirst({
      where: { ownerId: customer.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, status: true, adminNote: true },
    }),
    prisma.shopApplication.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, shopName: true, status: true, adminNote: true },
    }),
  ]);

  if (shop) {
    if (shop.status === "ACTIVE" || shop.status === "UNDER_REVIEW" || shop.status === "PENDING") {
      return NextResponse.json({
        state: shop.status,
        label: "Shop của tôi",
        href: "/seller",
        description: shop.name,
      });
    }

    if (shop.status === "SUSPENDED") {
      return NextResponse.json({
        state: shop.status,
        label: "Shop bị tạm khóa",
        href: "/seller",
        description: shop.adminNote || "Liên hệ admin để được xử lý.",
      });
    }

    return NextResponse.json({
      state: shop.status,
      label: "Mở shop lại",
      href: "/seller/register",
      description: shop.name,
    });
  }

  if (latestApplication?.status === "PENDING") {
    return NextResponse.json({
      state: "APPLICATION_PENDING",
      label: "Đơn mở shop đang chờ duyệt",
      href: "/seller/register",
      description: latestApplication.shopName,
    });
  }

  if (latestApplication?.status === "REJECTED") {
    return NextResponse.json({
      state: "APPLICATION_REJECTED",
      label: "Mở shop lại",
      href: "/seller/register",
      description: latestApplication.adminNote || "Đơn trước đó bị từ chối.",
    });
  }

  return NextResponse.json({
    state: "NONE",
    label: "Mở shop",
    href: "/seller/register",
    description: "Đăng ký shop cá nhân.",
  });
}
