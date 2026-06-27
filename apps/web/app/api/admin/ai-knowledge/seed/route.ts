import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { DEFAULT_AI_KNOWLEDGE } from "@/lib/ai-knowledge-defaults";

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    let created = 0;
    let updated = 0;

    for (const item of DEFAULT_AI_KNOWLEDGE) {
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
      total: DEFAULT_AI_KNOWLEDGE.length,
    });

    return NextResponse.json({
      success: true,
      created,
      updated,
      total: DEFAULT_AI_KNOWLEDGE.length,
    });
  } catch (error) {
    console.error("Error seeding AI knowledge:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
