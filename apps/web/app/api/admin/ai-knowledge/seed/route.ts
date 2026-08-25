import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { DEFAULT_AI_KNOWLEDGE } from "@/lib/ai-knowledge-defaults";
import { ADDITIONAL_AI_KNOWLEDGE } from "@/lib/ai-knowledge-additional";
import { aiDisabledResponse, isAiServerEnabled } from "@/lib/ai/feature";

export async function POST(request: NextRequest) {
  try {
    if (!isAiServerEnabled()) return aiDisabledResponse(404);

    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    let created = 0;
    let updated = 0;
    let deactivated = 0;

    const seedItems = [...DEFAULT_AI_KNOWLEDGE, ...ADDITIONAL_AI_KNOWLEDGE];

    const legacyResult = await prisma.aiKnowledge.updateMany({
      where: {
        isActive: true,
        category: { in: ["care", "general", "system", "product"] },
      },
      data: { isActive: false },
    });
    deactivated = legacyResult.count;

    for (const item of seedItems) {
      const keyword = item.keyword.trim().toLowerCase();
      const existing = await prisma.aiKnowledge.findFirst({
        where: { keyword },
        select: { id: true },
      });

      if (existing) {
        await prisma.aiKnowledge.update({
          where: { id: existing.id },
          data: {
            response: item.response.trim(),
            category: item.category,
            priority: item.priority,
            isActive: item.isActive,
          },
        });
        updated++;
      } else {
        await prisma.aiKnowledge.create({
          data: {
            keyword,
            response: item.response.trim(),
            category: item.category,
            priority: item.priority,
            isActive: item.isActive,
          },
        });
        created++;
      }
    }

    await logAdminAction(admin.id, "UPDATE", "AiKnowledge", "default-seed", {
      created,
      updated,
      deactivated,
      total: seedItems.length,
      additional: ADDITIONAL_AI_KNOWLEDGE.length,
    });

    return NextResponse.json({
      success: true,
      created,
      updated,
      deactivated,
      total: seedItems.length,
      additional: ADDITIONAL_AI_KNOWLEDGE.length,
    });
  } catch (error) {
    console.error("Error seeding AI knowledge:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
