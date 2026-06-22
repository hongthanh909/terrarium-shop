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

    // Extract unique values and filter out empty strings or nulls
    const wateringSet = new Set<string>();
    const sunlightSet = new Set<string>();
    const commonIssuesSet = new Set<string>();

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

    return NextResponse.json({
      watering: Array.from(wateringSet),
      sunlight: Array.from(sunlightSet),
      commonIssues: Array.from(commonIssuesSet),
    });
  } catch (error) {
    console.error("Error fetching care guide suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
