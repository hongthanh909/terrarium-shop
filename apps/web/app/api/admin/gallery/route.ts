import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const GALLERY_KEY = "brand_gallery";

export interface GalleryImage {
  id: string;
  imageUrl: string;
  alt: string;
  order: number;
  isActive: boolean;
}

// GET — Lấy danh sách ảnh gallery
export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: GALLERY_KEY },
    });

    const images: GalleryImage[] = setting
      ? (setting.value as any as GalleryImage[])
      : [];

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error fetching brand gallery:", error);
    return NextResponse.json(
      { error: "Không thể tải gallery" },
      { status: 500 }
    );
  }
}

// PUT — Lưu toàn bộ gallery
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const images: GalleryImage[] = body.images ?? [];

    await prisma.siteSetting.upsert({
      where: { key: GALLERY_KEY },
      update: { value: images as any },
      create: {
        key: GALLERY_KEY,
        value: images as any,
        description: "Ảnh gallery thương hiệu trang chủ - quản lý bởi admin",
      },
    });

    // Xóa ISR cache trang chủ ngay lập tức
    revalidatePath("/");

    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error("Error saving brand gallery:", error);
    return NextResponse.json(
      { error: "Không thể lưu gallery" },
      { status: 500 }
    );
  }
}
