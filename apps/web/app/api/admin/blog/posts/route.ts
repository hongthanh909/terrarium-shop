import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// GET - List all blog posts (including unpublished) for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (category) {
      where.categoryId = category;
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admin blog posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new blog post
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    const { title, slug, content, categoryId, published } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: "Tiêu đề và đường dẫn (slug) là bắt buộc" },
        { status: 400 }
      );
    }

    if (!content || content === "<p><br></p>" || content.trim() === "") {
      return NextResponse.json(
        { error: "Nội dung bài viết không được để trống" },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: `Đường dẫn "${slug}" đã tồn tại. Hãy chọn slug khác.` },
        { status: 400 }
      );
    }

    const isPublished = published === true;

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        categoryId: categoryId || null,
        published: isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
      include: { category: true },
    });

    await logAdminAction(admin.id, "CREATE", "BlogPost", post.id, {
      title: post.title,
      slug: post.slug,
      published: post.published,
    });

    // Revalidate blog pages so the post appears immediately without waiting for cache
    if (isPublished) {
      revalidatePath("/blog");
      revalidatePath(`/blog/${slug}`);
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi tạo bài viết" },
      { status: 500 }
    );
  }
}
