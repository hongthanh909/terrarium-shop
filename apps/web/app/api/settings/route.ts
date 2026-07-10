import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { maskSensitiveSettings } from "@/lib/privacy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const settings = await prisma.siteSetting.findMany({
      orderBy: { key: "asc" },
    });

    // Convert array of {key, value} to object
    const settingsObject: Record<string, any> = {};
    settings.forEach((setting) => {
      settingsObject[setting.key] = setting.value;
    });

    return NextResponse.json(maskSensitiveSettings(settingsObject));
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return NextResponse.json({ error: "Failed to fetch site settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Admin-only: vấn đề bảo mật — chỉ admin mới được cập nhật cài đặt website
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const body = await request.json();

    // body is a key-value map: { shopName: "...", shopEmail: "...", ... }
    const updates = Object.entries(body);

    await Promise.all(
      updates.map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value: value as any },
          create: { key, value: value as any },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving site settings:", error);
    return NextResponse.json({ error: "Failed to save site settings" }, { status: 500 });
  }
}
