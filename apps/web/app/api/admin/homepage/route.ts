import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const BANNER_KEY = "hero_banners";

export interface HomeBanner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  link?: string;
  order: number;
  isActive: boolean;
  productId?: string; // ID của sản phẩm liên kết (nếu có)
}

// GET — Fetch all home banners
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const setting = await prisma.siteSetting.findUnique({
      where: { key: BANNER_KEY },
    });

    const banners: HomeBanner[] = setting
      ? (setting.value as any as HomeBanner[])
      : [];

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("Error fetching home banners:", error);
    return NextResponse.json({ error: "Không thể tải banner" }, { status: 500 });
  }
}

// PUT — Replace all banners (full update)
export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    const banners: HomeBanner[] = body.banners ?? [];

    await prisma.siteSetting.upsert({
      where: { key: BANNER_KEY },
      update: { value: banners as any },
      create: {
        key: BANNER_KEY,
        value: banners as any,
        description: "Danh sách banner trang chủ - quản lý bởi admin",
      },
    });

    return NextResponse.json({ success: true, banners });
  } catch (error) {
    console.error("Error saving home banners:", error);
    return NextResponse.json({ error: "Không thể lưu banner" }, { status: 500 });
  }
}
