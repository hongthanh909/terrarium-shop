import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { createCategorySchema } from "@/lib/validations";
import { z } from "zod";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (id) {
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          children: true,
          products: {
            where: { status: "ACTIVE" },
            include: {
              variants: true,
            },
            take: 10,
          },
        },
      });

      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }

      return NextResponse.json(category, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
      });
    }

    let whereClause: any = {};
    if (status && status !== "all") {
      whereClause = { status };
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { products: true },
          },
          parent: true,
        },
        orderBy: {
          name: "asc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.category.count({ where: whereClause })
    ]);

    return NextResponse.json({
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    
    // Validate request body
    const validatedData = createCategorySchema.parse(body);

    const category = await prisma.category.create({
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

    await logAdminAction(admin.id, "CREATE", "Category", category.id, {
      name: category.name,
      slug: category.slug,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}