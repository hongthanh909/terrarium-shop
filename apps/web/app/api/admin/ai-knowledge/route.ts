import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";

// GET — Lấy tất cả knowledge entries
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const entries = await prisma.aiKnowledge.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching AI knowledge:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Tạo mới entry
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    const { keyword, response, category = "general", priority = 0, isActive = true } = body;

    if (!keyword?.trim() || !response?.trim()) {
      return NextResponse.json({ error: "Từ khóa và nội dung trả lời là bắt buộc" }, { status: 400 });
    }

    const entry = await prisma.aiKnowledge.create({
      data: {
        keyword: keyword.trim().toLowerCase(),
        response: response.trim(),
        category: category.trim(),
        priority,
        isActive,
      },
    });

    await logAdminAction(admin.id, "CREATE", "AiKnowledge", entry.id, {
      keyword: entry.keyword,
      category: entry.category,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating AI knowledge:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT — Cập nhật entry (bulk hoặc single bằng id trong body)
export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    const { id, keyword, response, category, priority, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID là bắt buộc" }, { status: 400 });
    }

    const entry = await prisma.aiKnowledge.update({
      where: { id },
      data: {
        ...(keyword !== undefined && { keyword: keyword.trim().toLowerCase() }),
        ...(response !== undefined && { response: response.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await logAdminAction(admin.id, "UPDATE", "AiKnowledge", entry.id, {
      keyword: entry.keyword,
      category: entry.category,
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error updating AI knowledge:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — Xóa entry
export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID là bắt buộc" }, { status: 400 });
    }

    const entry = await prisma.aiKnowledge.findUnique({ where: { id } });
    if (!entry) {
      return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    }

    await prisma.aiKnowledge.delete({ where: { id } });

    await logAdminAction(admin.id, "DELETE", "AiKnowledge", id, {
      keyword: entry.keyword,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting AI knowledge:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
