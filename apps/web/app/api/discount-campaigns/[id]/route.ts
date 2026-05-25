import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await prisma.discountCampaign.findUnique({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

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
      where: { id: params.id },
    });

    if (!existing) {
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
      where: { id: params.id },
      data: {
        code,
        type,
        value: parseFloat(value.toString()),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount.toString()) : null,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount.toString()) : null,
        startsAt: new Date(startsAt),
        expiresAt: new Date(expiresAt),
        usageLimit: usageLimit || null,
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

    await logAdminAction(admin.id, "UPDATE", "DiscountCampaign", params.id, {
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
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const campaign = await prisma.discountCampaign.delete({
      where: { id: params.id },
    });

    await logAdminAction(admin.id, "DELETE", "DiscountCampaign", params.id, {
      code: campaign.code,
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Error deleting discount campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete discount campaign" },
      { status: 500 }
    );
  }
}