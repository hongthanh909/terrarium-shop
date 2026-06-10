import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const HERO_BG_KEY = "hero_bg";

export interface HeroBgSetting {
  imageUrl: string;       // URL ảnh nền, "" = dùng màu gradient mặc định
  overlayOpacity: number; // 0-100, mặc định 40 (overlay tối nhạt để text dễ đọc)
}

const DEFAULT: HeroBgSetting = { imageUrl: "", overlayOpacity: 40 };

// GET
export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: HERO_BG_KEY },
    });
    const data: HeroBgSetting = setting
      ? (setting.value as any as HeroBgSetting)
      : DEFAULT;
    return NextResponse.json({ heroBg: data });
  } catch (error) {
    console.error("Error fetching hero bg:", error);
    return NextResponse.json({ heroBg: DEFAULT });
  }
}

// PUT
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data: HeroBgSetting = {
      imageUrl: body.imageUrl ?? "",
      overlayOpacity: Number(body.overlayOpacity ?? 40),
    };

    await prisma.siteSetting.upsert({
      where: { key: HERO_BG_KEY },
      update: { value: data as any },
      create: {
        key: HERO_BG_KEY,
        value: data as any,
        description: "Ảnh nền Hero Section trang chủ",
      },
    });

    revalidatePath("/");

    return NextResponse.json({ success: true, heroBg: data });
  } catch (error) {
    console.error("Error saving hero bg:", error);
    return NextResponse.json({ error: "Không thể lưu" }, { status: 500 });
  }
}
