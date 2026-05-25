import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";

// PUT - Update a blog category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { id } = params;
    const body = await request.json();
    const { name, slug } = body;

    const existingCategory = await prisma.blogCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Blog category not found" },
        { status: 404 }
      );
    }

    const category = await prisma.blogCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
      },
    });

    await logAdminAction(admin.id, "UPDATE", "BlogCategory", category.id, {
      name: category.name,
      slug: category.slug,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating blog category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a blog category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { id } = params;

    const category = await prisma.blogCategory.findUnique({ where: { id }});
    if (!category) {
      return NextResponse.json({ error: "Blog category not found" }, { status: 404 });
    }

    // Check if category is used
    const postsCount = await prisma.blogPost.count({
      where: { categoryId: id },
    });

    if (postsCount > 0) {
      return NextResponse.json(
        { error: "Không thể xóa danh mục đang có bài viết" },
        { status: 400 }
      );
    }

    await prisma.blogCategory.delete({
      where: { id },
    });

    await logAdminAction(admin.id, "DELETE", "BlogCategory", id, {
      name: category.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
