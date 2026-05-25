import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: { slug: string };
}

// BUG-15 fix: generate per-post metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: "Bài viết không tìm thấy" };

  const description = post.content
    .replace(/<[^>]+>/g, "") // strip HTML tags
    .slice(0, 160)
    .trim();

  return {
    title: `${post.title} | Blog - Tiệm Rêu Decor`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
    },
  };
}

async function getPost(slug: string) {
  try {
    return await prisma.blogPost.findUnique({
      where: { slug, published: true },
      include: { category: true },
    });
  } catch {
    return null;
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[hsl(0,0%,100%)] py-8 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center text-[#425733] hover:text-[#364a29] mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Về trang Blog
        </Link>

        {/* Post Content */}
        <article>
          <header className="mb-8">
            {post.category && (
              <Badge className="mb-4 bg-[#e3ebdd] text-[#425733]">
                <Tag className="w-3 h-3 mr-1" />
                {post.category.name}
              </Badge>
            )}
            <h1 className="text-4xl font-bold text-[hsl(220,14%,25%)] mb-4">
              {post.title}
            </h1>
            {post.publishedAt && (
              <div className="flex items-center text-sm text-[hsl(220,14%,45%)]">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(post.publishedAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}
          </header>

          <div className="prose prose-lg max-w-none">
            <div
              className="text-[hsl(220,14%,35%)] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>

        {/* Divider */}
        <hr className="my-12 border-[#e3ebdd]" />

        {/* Related Posts */}
        <div className="text-center">
          <p className="text-[hsl(220,14%,45%)] mb-4">
            Thích bài viết này? Khám phá thêm tại
          </p>
          <Button asChild variant="outline" className="border-[#c8d5be]">
            <Link href="/blog">Xem Tất Cả Bài Viết</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}