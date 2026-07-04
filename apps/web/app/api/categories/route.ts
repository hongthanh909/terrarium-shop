import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { createCategorySchema } from "@/lib/validations";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
    log: ["error"],
  });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (id) {
      const category = await client.category.findUnique({
        where: { id },
        include: {
          children: {
            orderBy: [
              { sortOrder: "asc" },
              { name: "asc" },
            ],
          },
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
      client.category.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { products: true },
          },
          parent: true,
        },
        orderBy: [
          { sortOrder: "asc" },
          { name: "asc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      client.category.count({ where: whereClause })
    ]);

    const isNocache = status === "all" || searchParams.get("nocache") === "true";
    const cacheHeader = isNocache
      ? "no-store, no-cache, must-revalidate, proxy-revalidate"
      : "public, s-maxage=300, stale-while-revalidate=3600";

    return NextResponse.json({
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    }, {
      headers: { "Cache-Control": cacheHeader },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.$disconnect().catch(() => {});
  }
}

export async function POST(request: NextRequest) {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
    log: ["error"],
  });

  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    
    // Validate request body
    const validatedData = createCategorySchema.parse(body);
    const parentId = validatedData.parentId || null;
    const lastCategory = await client.category.findFirst({
      where: { parentId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const category = await client.category.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        metaDescription: validatedData.metaDescription || null,
        parentId,
        status: validatedData.status,
        sortOrder: (lastCategory?.sortOrder ?? -1) + 1,
      },
      include: {
        parent: true,
      },
    });

    await logAdminAction(admin.id, "CREATE", "Category", category.id, {
      name: category.name,
      slug: category.slug,
    });

    // Revalidate user-facing pages
    revalidatePath("/products");
    revalidatePath("/");

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
  } finally {
    await client.$disconnect().catch(() => {});
  }
}

export async function PATCH(request: NextRequest) {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
    log: ["error"],
  });

  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    const schema = z.object({
      orderedIds: z.array(z.string()).min(1),
      parentId: z.string().nullable().optional(),
    });
    const { orderedIds, parentId = null } = schema.parse(body);
    const uniqueIds = Array.from(new Set(orderedIds));

    if (uniqueIds.length !== orderedIds.length) {
      return NextResponse.json(
        { error: "Danh sách danh mục bị trùng lặp" },
        { status: 400 }
      );
    }

    const categories = await client.category.findMany({
      where: { id: { in: orderedIds } },
      select: { id: true, parentId: true },
    });

    if (categories.length !== orderedIds.length) {
      return NextResponse.json(
        { error: "Không tìm thấy đủ danh mục để sắp xếp" },
        { status: 400 }
      );
    }

    const hasDifferentParent = categories.some((category) => category.parentId !== parentId);
    if (hasDifferentParent) {
      return NextResponse.json(
        { error: "Chỉ có thể sắp xếp các danh mục cùng cấp" },
        { status: 400 }
      );
    }

    await client.$transaction(
      orderedIds.map((id, index) =>
        client.category.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    await logAdminAction(admin.id, "UPDATE", "Category", "multiple", {
      action: "REORDER",
      orderedIds,
      parentId,
    });

    revalidatePath("/products");
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error reordering categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.$disconnect().catch(() => {});
  }
}
