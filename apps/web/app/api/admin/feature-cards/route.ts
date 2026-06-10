import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FEATURE_CARDS_KEY = "feature_cards";

export interface FeatureCard {
  id: string; // "01" | "02" | "03" | "04"
  bgImage: string; // URL ảnh nền, "" nếu không có
}

const DEFAULT_CARDS: FeatureCard[] = [
  { id: "01", bgImage: "" },
  { id: "02", bgImage: "" },
  { id: "03", bgImage: "" },
  { id: "04", bgImage: "" },
];

// GET — Lấy cài đặt ảnh nền 4 feature cards
export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: FEATURE_CARDS_KEY },
    });

    const cards: FeatureCard[] = setting
      ? (setting.value as any as FeatureCard[])
      : DEFAULT_CARDS;

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Error fetching feature cards:", error);
    return NextResponse.json(
      { error: "Không thể tải cài đặt feature cards" },
      { status: 500 }
    );
  }
}

// PUT — Lưu ảnh nền cho 4 feature cards
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const cards: FeatureCard[] = body.cards ?? DEFAULT_CARDS;

    await prisma.siteSetting.upsert({
      where: { key: FEATURE_CARDS_KEY },
      update: { value: cards as any },
      create: {
        key: FEATURE_CARDS_KEY,
        value: cards as any,
        description: "Ảnh nền 4 feature cards trang chủ - quản lý bởi admin",
      },
    });

    return NextResponse.json({ success: true, cards });
  } catch (error) {
    console.error("Error saving feature cards:", error);
    return NextResponse.json(
      { error: "Không thể lưu cài đặt feature cards" },
      { status: 500 }
    );
  }
}
