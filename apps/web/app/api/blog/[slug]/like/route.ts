import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Retrieve likes count and check if current customer liked it
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const session = await getServerSession(authOptions);
    const customerId = (session?.user as any)?.id;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Bài viết không tồn tại" }, { status: 404 });
    }

    const [likesCount, userLiked] = await Promise.all([
      prisma.blogLike.count({ where: { postId: post.id } }),
      customerId
        ? prisma.blogLike.findUnique({
            where: {
              postId_customerId: {
                postId: post.id,
                customerId,
              },
            },
          })
        : null,
    ]);

    return NextResponse.json({
      likesCount,
      liked: !!userLiked,
    });
  } catch (error) {
    console.error("Error fetching likes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Toggle like status for the blog post
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để tương tác" }, { status: 401 });
    }

    const customerId = (session.user as any).id;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Bài viết không tồn tại" }, { status: 404 });
    }

    const existingLike = await prisma.blogLike.findUnique({
      where: {
        postId_customerId: {
          postId: post.id,
          customerId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.blogLike.delete({
        where: {
          postId_customerId: {
            postId: post.id,
            customerId,
          },
        },
      });
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.blogLike.create({
        data: {
          postId: post.id,
          customerId,
        },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
