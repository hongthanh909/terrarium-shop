import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
    log: ["error"],
  });

  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();
    const { reason, unset } = body;

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Get Monday
    weekStart.setHours(0, 0, 0, 0);

    if (unset) {
      // Bỏ set weekly featured của tuần này
      await client.weeklyFeatured.deleteMany({
        where: {
          weekStart: weekStart,
        },
      });

      await logAdminAction(admin.id, "DELETE", "WeeklyFeatured", id, {
        action: "UNSET_WEEKLY",
        weekStart: weekStart.toISOString(),
      });

      return NextResponse.json({ message: "Đã gỡ khỏi Weekly Featured" });
    }

    // Upsert để chỉ có 1 Weekly Featured cho 1 tuần, hoặc có thể nhiều nếu logic cho phép.
    // Ở đây ta dùng deleteMany để xóa cũ rồi tạo mới cho dễ vì weekStart_productId là unique,
    // nhưng ta muốn 1 tuần chỉ có 1 sản phẩm featured (nếu model cho phép, ở đây ta cứ deactivate các cái cũ)
    
    await client.weeklyFeatured.updateMany({
      where: { weekStart },
      data: { isActive: false },
    });

    const weekly = await client.weeklyFeatured.upsert({
      where: {
        weekStart_productId: {
          weekStart,
          productId: id,
        }
      },
      update: {
        isActive: true,
        reason: reason || null,
      },
      create: {
        weekStart,
        productId: id,
        reason: reason || null,
        isActive: true,
      },
    });

    await logAdminAction(admin.id, "UPDATE", "WeeklyFeatured", id, {
      action: "SET_WEEKLY",
      weekStart: weekStart.toISOString(),
      reason: reason || null,
    });

    return NextResponse.json(weekly);
  } catch (error) {
    console.error("Error setting weekly product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.$disconnect().catch(() => {});
  }
}
