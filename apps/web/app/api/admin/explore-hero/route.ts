import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const KEY = "explore_hero_bg";

export interface ExploreHeroBg {
  imageUrl: string;  // URL ảnh nền blur
  blur: number;      // 0-20 (px), mặc định 12
}

const DEFAULT: ExploreHeroBg = { imageUrl: "", blur: 12 };

// GET — public (dùng cho server component)
export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: KEY } });
    const data: ExploreHeroBg = setting ? (setting.value as any) : DEFAULT;
    return NextResponse.json({ heroBg: data });
  } catch {
    return NextResponse.json({ heroBg: DEFAULT });
  }
}

// PUT — admin only
export async function PUT(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  const body = await request.json();
  const data: ExploreHeroBg = {
    imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : "",
    blur: Math.max(0, Math.min(20, Number(body.blur ?? 12))),
  };

  await prisma.siteSetting.upsert({
    where: { key: KEY },
    update: { value: data as any },
    create: {
      key: KEY,
      value: data as any,
      description: "Ảnh nền blur hero section trang Khám Phá",
    },
  });

  revalidatePath("/explore");

  return NextResponse.json({ success: true, heroBg: data });
}
