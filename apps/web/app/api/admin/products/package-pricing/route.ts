import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";

const syncPackagePricingSchema = z.object({
  standardPackageAdjustment: z.number().int().min(0),
  advancedPackageAdjustment: z.number().int().min(0),
  packageOptionsEnabled: z.boolean().optional().default(true),
});

export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const input = syncPackagePricingSchema.parse(await request.json());
    const result = await prisma.product.updateMany({
      data: {
        packageOptionsEnabled: input.packageOptionsEnabled,
        standardPackageAdjustment: input.standardPackageAdjustment,
        advancedPackageAdjustment: input.advancedPackageAdjustment,
      },
    });

    await logAdminAction(admin.id, "UPDATE", "ProductPackagePricing", "all", {
      ...input,
      updatedProducts: result.count,
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/explore");

    return NextResponse.json({ success: true, updatedProducts: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Giá gói không hợp lệ" },
        { status: 400 },
      );
    }

    console.error("Error syncing package pricing:", error);
    return NextResponse.json(
      { error: "Không thể đồng bộ giá gói sản phẩm" },
      { status: 500 },
    );
  }
}
