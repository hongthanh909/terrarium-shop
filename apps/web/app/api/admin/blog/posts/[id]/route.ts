import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";


// GET - Fetch a single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { id } = params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update a blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { id } = params;
    const reqData = await request.json();
    const { title, slug, content, thumbnail, images, intro, body, conclusion, categoryId, published } = reqData;

    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Set publishedAt when publishing for the first time
    let publishedAt = existingPost.publishedAt;
    if (published && !existingPost.published) {
      publishedAt = new Date();
    } else if (published === false) {
      publishedAt = null;
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(images !== undefined && { images }),
        ...(intro !== undefined && { intro }),
        ...(body !== undefined && { body }),
        ...(conclusion !== undefined && { conclusion }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(published !== undefined && { published }),
        publishedAt,
      },
      include: {
        category: true,
      },
    });

    await logAdminAction(admin.id, "UPDATE", "BlogPost", post.id, {
      title: post.title,
      slug: post.slug,
      published: post.published,
    });

    // Revalidate so changes appear immediately
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { id } = params;

    const post = await prisma.blogPost.findUnique({ where: { id }});
    if (!post) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    await prisma.blogPost.delete({
      where: { id },
    });

    await logAdminAction(admin.id, "DELETE", "BlogPost", id, {
      title: post.title,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
