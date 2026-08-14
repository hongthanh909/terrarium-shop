import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const includePrivate = searchParams.get("includePrivate") === "true";
    const admin = includePrivate ? await verifyAdminRequest(request) : null;

    const campaigns = await prisma.discountCampaign.findMany({
      where: {
        deletedAt: null,
        ...(admin ? {} : { discountCodes: { none: {} } }),
        ...(status ? { status: status as any } : {}),
      },
      include: {
        applicables: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching discount campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch discount campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (!code || !type || !value || !startsAt || !expiresAt) {
      return NextResponse.json(
        { error: "Missing required fields: code, type, value, startsAt, expiresAt" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.discountCampaign.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Discount code already exists" },
        { status: 400 }
      );
    }

    // Create campaign with applicable items
    const campaign = await prisma.discountCampaign.create({
      data: {
        code,
        type,
        value: parseFloat(value.toString()),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount.toString()) : null,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount.toString()) : null,
        startsAt: new Date(startsAt),
        expiresAt: new Date(expiresAt),
        usageLimit: usageLimit ? parseInt(usageLimit.toString(), 10) : null,
        status: status || "INACTIVE",
        applicableTo,
        description,
        applicables: {
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

    await logAdminAction(admin.id, "CREATE", "DiscountCampaign", campaign.id, {
      code: campaign.code,
      type: campaign.type,
      value: campaign.value,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error creating discount campaign:", error);
    return NextResponse.json(
      { error: "Failed to create discount campaign" },
      { status: 500 }
    );
  }
}
