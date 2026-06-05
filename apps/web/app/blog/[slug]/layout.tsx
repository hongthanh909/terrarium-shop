import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: params.slug },
      select: {
        title: true,
        content: true,
        intro: true,
        body: true,
        publishedAt: true,
        category: { select: { name: true } },
      },
    });

    if (!post) {
      return {
        title: "Bài viết không tồn tại | Tiệm Rêu Décor",
        description: "Bài viết bạn tìm kiếm không tồn tại hoặc đã bị xóa.",
      };
    }

    // Lấy ~160 ký tự đầu của content/intro/body làm description (bỏ HTML tags)
    const plainText = (post.content || post.intro || post.body || "").replace(/<[^>]+>/g, "").slice(0, 160).trim();
    const description =
      plainText ||
      `Đọc bài viết "${post.title}" trên blog Tiệm Rêu Décor. Kiến thức chăm sóc terrarium, moss art và cây cảnh mini.`;

    const title = `${post.title} | Tiệm Rêu Décor Blog`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        publishedTime: post.publishedAt?.toISOString(),
        locale: "vi_VN",
        siteName: "Tiệm Rêu Décor",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Blog | Tiệm Rêu Décor",
      description: "Đọc các bài viết về terrarium, moss art và cây cảnh mini.",
    };
  }
}

export default function BlogSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
