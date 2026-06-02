/**
 * Admin Explore — WeeklyFeatured API
 * GET    /api/admin/explore  — Lấy danh sách featured hiện tại
 * POST   /api/admin/explore  — Ghim sản phẩm lên Explore
 * DELETE /api/admin/explore  — Bỏ ghim sản phẩm
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

// ─── GET: Lấy danh sách WeeklyFeatured hiện tại ─────────────────────────
export async function GET(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  const featured = await prisma.weeklyFeatured.findMany({
    where: { isActive: true },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          basePrice: true,
          status: true,
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { weekStart: "desc" },
    take: 20,
  });

  return NextResponse.json(featured);
}

// ─── POST: Ghim sản phẩm lên Explore ─────────────────────────────────────
export async function POST(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  const { productId, reason, weekStart } = await request.json();

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Tính đầu tuần (Monday) nếu không truyền vào
  const weekStartDate = weekStart
    ? new Date(weekStart)
    : (() => {
        const d = new Date();
        const day = d.getDay(); // 0=Sun, 1=Mon...
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
      })();

  // Upsert — nếu đã ghim tuần này thì cập nhật lại
  const created = await prisma.weeklyFeatured.upsert({
    where: {
      weekStart_productId: {
        weekStart: weekStartDate,
        productId,
      },
    },
    update: { isActive: true, reason: reason ?? null },
    create: {
      weekStart: weekStartDate,
      productId,
      reason: reason ?? null,
      isActive: true,
    },
    include: {
      product: { select: { name: true, slug: true } },
    },
  });

  await logAdminAction(admin.id, "CREATE", "WeeklyFeatured", created.id, {
    productId,
    productName: created.product.name,
    weekStart: weekStartDate,
  });

  revalidatePath("/explore");
  revalidatePath("/");

  return NextResponse.json(created, { status: 201 });
}

// ─── DELETE: Bỏ ghim sản phẩm ─────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const item = await prisma.weeklyFeatured.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft delete — chỉ đặt isActive = false
  await prisma.weeklyFeatured.update({
    where: { id },
    data: { isActive: false },
  });

  await logAdminAction(admin.id, "DELETE", "WeeklyFeatured", id, {});

  revalidatePath("/explore");
  revalidatePath("/");

  return NextResponse.json({ success: true });
}
