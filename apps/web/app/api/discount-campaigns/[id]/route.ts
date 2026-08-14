import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { Prisma } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await prisma.discountCampaign.findUnique({
      where: { id },
      include: {
        applicables: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Discount campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error fetching discount campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch discount campaign" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { id } = await params;

    const body = await request.json();
    const {
      code,
      type,
      value,
      minOrderAmount,
      maxDiscountAmount,
      startsAt,
      expiresAt,
      usageLimit,
      status,
      applicableTo,
      description,
      applicableProducts = [],
      applicableCategories = [],
    } = body;

    // Check if campaign exists
    const existing = await prisma.discountCampaign.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { error: "Discount campaign not found" },
        { status: 404 }
      );
    }

    // Check if code already exists (excluding current campaign)
    if (code !== existing.code) {
      const codeExists = await prisma.discountCampaign.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: "Discount code already exists" },
          { status: 400 }
        );
      }
    }

    // Update campaign with applicable items
    const campaign = await prisma.discountCampaign.update({
      where: { id },
      data: {
        code,
        type,
        value: parseFloat(value.toString()),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount.toString()) : null,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount.toString()) : null,
        startsAt: new Date(startsAt),
        expiresAt: new Date(expiresAt),
        usageLimit: usageLimit ? parseInt(usageLimit.toString(), 10) : null,
        status: status || existing.status,
        applicableTo,
        description,
        applicables: {
          deleteMany: {},
          create: [
            ...applicableProducts.map((productId: string) => ({
              targetType: "PRODUCT",
              targetId: productId,
            })),
            ...applicableCategories.map((categoryId: string) => ({
              targetType: "CATEGORY",
              targetId: categoryId,
            })),
          ],
        },
      },
      include: {
        applicables: true,
      },
    });

    await logAdminAction(admin.id, "UPDATE", "DiscountCampaign", id, {
      code: campaign.code,
      type: campaign.type,
      value: campaign.value,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error updating discount campaign:", error);
    return NextResponse.json(
      { error: "Failed to update discount campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { id } = await params;
    const existing = await prisma.discountCampaign.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        deletedAt: true,
        orderDiscounts: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { error: "Discount campaign not found" },
        { status: 404 }
      );
    }

    const hasOrderHistory = existing.orderDiscounts.length > 0;
    if (hasOrderHistory) {
      await prisma.discountCampaign.update({
        where: { id },
        data: {
          status: "INACTIVE",
          deletedAt: new Date(),
        },
      });

      await logAdminAction(admin.id, "DELETE", "DiscountCampaign", id, {
        code: existing.code,
        mode: "ARCHIVE",
      });

      return NextResponse.json({
        success: true,
        archived: true,
        message: "Voucher đã được lưu trữ vì đã có lịch sử đơn hàng",
      });
    }

    const campaign = await prisma.discountCampaign.delete({
      where: { id },
    });

    await logAdminAction(admin.id, "DELETE", "DiscountCampaign", id, {
      code: campaign.code,
      mode: "HARD_DELETE",
    });

    return NextResponse.json({ success: true, archived: false, campaign });
  } catch (error) {
    console.error("Error deleting discount campaign:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "Voucher đã có lịch sử đơn hàng và không thể xóa trực tiếp" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Không thể xóa voucher" },
      { status: 500 }
    );
  }
}
