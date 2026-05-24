import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { updateCategorySchema } from "@/lib/validations";
import { z } from "zod";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { id } = params;
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

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
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
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { id } = params;

    const category = await prisma.category.findUnique({ where: { id }});
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    await prisma.category.delete({
      where: { id },
    });

    await logAdminAction(admin.id, "DELETE", "Category", id, {
      name: category.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}