import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { updateCategorySchema } from "@/lib/validations";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: (await params).id },
      include: { parent: true },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    
    // Validate request body
    const validatedData = updateCategorySchema.parse(body);

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        metaDescription: validatedData.metaDescription || null,
        parentId: validatedData.parentId || null,
        status: validatedData.status,
      },
      include: {
        parent: true,
      },
    });

    await logAdminAction(admin.id, "UPDATE", "Category", category.id, {
      name: category.name,
      slug: category.slug,
      status: category.status,
    });

    // Revalidate user-facing pages
    revalidatePath("/products");
    revalidatePath("/");

    return NextResponse.json(category);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Đường dẫn (slug) đã tồn tại. Vui lòng chọn đường dẫn khác." },
        { status: 400 }
      );
    }
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    const category = await prisma.category.findUnique({ where: { id }});
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Block delete if category has products
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Không thể xóa danh mục đang có ${productCount} sản phẩm. Hãy di chuyển hoặc xóa sản phẩm trước.` },
        { status: 400 }
      );
    }

    // Block delete if category has children
    const childCount = await prisma.category.count({ where: { parentId: id } });
    if (childCount > 0) {
      return NextResponse.json(
        { error: `Không thể xóa danh mục đang có ${childCount} danh mục con.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    await logAdminAction(admin.id, "DELETE", "Category", id, {
      name: category.name,
    });

    // Revalidate user-facing pages
    revalidatePath("/products");
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi xóa danh mục" },
      { status: 500 }
    );
  }
}