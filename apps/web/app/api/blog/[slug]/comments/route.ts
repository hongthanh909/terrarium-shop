import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Retrieve all comments (and their replies) for a blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Bài viết không tồn tại" }, { status: 404 });
    }

    const comments = await prisma.blogComment.findMany({
      where: { postId: post.id },
      include: {
        customer: {
          select: { id: true, name: true, role: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Post a comment on the blog post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để bình luận" }, { status: 401 });
    }

    const customerId = (session.user as any).id;
    const { content } = await request.json();

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Nội dung bình luận không được trống" }, { status: 400 });
    }

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Bài viết không tồn tại" }, { status: 404 });
    }

    const comment = await prisma.blogComment.create({
      data: {
        postId: post.id,
        customerId,
        content: content.trim(),
      },
      include: {
        customer: {
          select: { id: true, name: true, role: true },
        },
        replies: true,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
