import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  try {
    // Query all CareGuides from the DB
    const careGuides = await prisma.careGuide.findMany({
      select: {
        watering: true,
        sunlight: true,
        commonIssues: true,
      },
    });

    // Query all Products from the DB for specification suggestions
    const products = await prisma.product.findMany({
      select: {
        size: true,
        soil: true,
        moss: true,
        driftwood: true,
        accessories: true,
      },
    });

    // Extract unique values and filter out empty strings or nulls
    const wateringSet = new Set<string>();
    const sunlightSet = new Set<string>();
    const commonIssuesSet = new Set<string>();

    const sizeSet = new Set<string>();
    const soilSet = new Set<string>();
    const mossSet = new Set<string>();
    const driftwoodSet = new Set<string>();
    const accessoriesSet = new Set<string>();

    careGuides.forEach((cg) => {
      if (cg.watering && cg.watering.trim()) {
        wateringSet.add(cg.watering.trim());
      }
      if (cg.sunlight && cg.sunlight.trim()) {
        sunlightSet.add(cg.sunlight.trim());
      }
      if (cg.commonIssues && cg.commonIssues.trim()) {
        commonIssuesSet.add(cg.commonIssues.trim());
      }
    });

    products.forEach((p) => {
      if (p.size && p.size.trim()) {
        sizeSet.add(p.size.trim());
      }
      if (p.soil && p.soil.trim()) {
        soilSet.add(p.soil.trim());
      }
      if (p.moss && p.moss.trim()) {
        mossSet.add(p.moss.trim());
      }
      if (p.driftwood && p.driftwood.trim()) {
        driftwoodSet.add(p.driftwood.trim());
      }
      if (p.accessories && p.accessories.trim()) {
        accessoriesSet.add(p.accessories.trim());
      }
    });

    return NextResponse.json({
      watering: Array.from(wateringSet),
      sunlight: Array.from(sunlightSet),
      commonIssues: Array.from(commonIssuesSet),
      size: Array.from(sizeSet),
      soil: Array.from(soilSet),
      moss: Array.from(mossSet),
      driftwood: Array.from(driftwoodSet),
      accessories: Array.from(accessoriesSet),
    });
  } catch (error) {
    console.error("Error fetching care guide suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
