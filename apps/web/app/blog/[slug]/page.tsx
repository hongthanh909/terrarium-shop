"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  published: boolean;
  publishedAt: string | null;
  category: {
    id: string;
    slug: string;
    name: string;
  } | null;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [params.slug]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/${params.slug}`);
      const data = await response.json();
      setPost(data);
    } catch (error) {
      console.error("Error fetching blog post:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[hsl(0,0%,100%)] py-8 px-6">
        <div className="max-w-3xl mx-auto text-center py-12">
          <p className="text-[hsl(220,14%,45%)]">Đang tải...</p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-[hsl(0,0%,100%)] py-8 px-6">
        <div className="max-w-3xl mx-auto text-center py-12">
          <p className="text-[hsl(220,14%,45%)]">Bài viết không tồn tại.</p>
          <Button asChild className="mt-4">
            <Link href="/blog">Về trang Blog</Link>
          </Button>
        </div>
      </main>
    );
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
              className="text-[hsl(220,14%,35%)] leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>

        {/* Divider */}
        <hr className="my-12 border-[#e3ebdd]" />

        {/* Related Posts (placeholder) */}
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
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${className}`}>{children}</span>;
}