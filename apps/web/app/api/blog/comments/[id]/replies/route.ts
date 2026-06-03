import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST - Post a reply to a specific comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const commentId = params.id;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để trả lời" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { content } = await request.json();

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Nội dung trả lời không được trống" }, { status: 400 });
    }

    // Check if parent comment exists
    const parentComment = await prisma.blogComment.findUnique({
      where: { id: commentId },
    });

    if (!parentComment) {
      return NextResponse.json({ error: "Bình luận không tồn tại" }, { status: 404 });
    }

    // Check if the current user is an Admin
    const user = await prisma.customer.findUnique({
      where: { id: userId },
      select: { role: true, name: true },
    });

    const isAdmin = user?.role === "ADMIN";

    const reply = await prisma.blogReply.create({
      data: {
        commentId,
        userId,
        content: content.trim(),
        isAdmin,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    console.error("Error creating reply:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
