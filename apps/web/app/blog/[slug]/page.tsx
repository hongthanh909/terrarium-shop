import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize-html";
import BlogInteraction from "./BlogInteraction";

// force-dynamic to avoid ISR/cache issues in standalone mode
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

// NOTE: generateMetadata is in layout.tsx — do NOT duplicate here

export default async function BlogPostPage({ params }: Props) {
  let post: any = null;

  try {
    post = await prisma.blogPost.findUnique({
      where: { slug: (await params).slug, published: true },
      include: { category: true },
    });
  } catch (error) {
    console.error("[BlogPost] DB error:", error);
  }

  if (!post) {
    notFound();
  }

  const hasStructuredContent = post.intro || post.body || post.conclusion;
  const safeIntro = sanitizeHtml(post.intro);
  const safeBody = sanitizeHtml(post.body);
  const safeConclusion = sanitizeHtml(post.conclusion);
  const safeContent = sanitizeHtml(post.content);

  return (
    <main className="min-h-screen bg-[#fafbf8] py-8 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center text-[#425733] hover:text-[#364a29] mb-6 text-sm font-semibold transition-colors"
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 leading-tight">
              {post.title}
            </h1>
            {post.publishedAt && (
              <div className="flex items-center text-xs text-gray-400 font-medium">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                {new Date(post.publishedAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}
          </header>

          {/* Blog Banner Thumbnail */}
          {post.thumbnail && (
            <div className="mb-8 rounded-2xl overflow-hidden border border-gray-100 shadow-sm aspect-video max-h-[350px]">
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="prose prose-emerald max-w-none">
            {/* Structured Content Rendering */}
            {hasStructuredContent ? (
              <div className="space-y-6">
                {/* Introduction (Mở bài) */}
                {post.intro && (
                  <div
                    className="text-gray-700 leading-relaxed font-medium text-lg border-l-4 border-[#425733] pl-4 italic mb-8"
                    dangerouslySetInnerHTML={{ __html: safeIntro }}
                  />
                )}

                {/* Body Content (Thân bài) */}
                {post.body && (
                  <div
                    className="text-gray-600 leading-relaxed text-base space-y-4"
                    dangerouslySetInnerHTML={{ __html: safeBody }}
                  />
                )}

                {/* Additional Gallery Images */}
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
                    {post.images.map((img: string, idx: number) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50 flex items-center justify-center p-2 min-h-[220px]">
                        <img
                          src={img}
                          alt={`${post.title} gallery ${idx + 1}`}
                          className="max-w-full max-h-[400px] w-auto h-auto object-contain hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Conclusion (Kết bài) */}
                {post.conclusion && (
                  <div
                    className="text-gray-600 leading-relaxed text-base pt-6 border-t border-dashed border-gray-150"
                    dangerouslySetInnerHTML={{ __html: safeConclusion }}
                  />
                )}
              </div>
            ) : (
              /* Fallback to legacy full rich text content column */
              post.content && (
                <div
                  className="text-gray-600 leading-relaxed text-base"
                  dangerouslySetInnerHTML={{ __html: safeContent }}
                />
              )
            )}
          </div>
        </article>

        {/* Customer Interaction Segment (Likes, Comments & Real-time replies) */}
        <BlogInteraction postId={post.id} slug={post.slug} />

        {/* Divider */}
        <hr className="my-12 border-gray-100" />

        {/* Related Posts */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4 font-semibold">
            Thích bài viết này? Khám phá thêm tại
          </p>
          <Button asChild variant="outline" className="border-[#c8d5be] hover:bg-[#f0f4ec] rounded-full font-semibold px-6">
            <Link href="/blog">Xem Tất Cả Bài Viết</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
