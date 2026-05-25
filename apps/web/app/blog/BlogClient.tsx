"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface BlogCategory {
  id: string;
  slug: string;
  name: string;
}

export function BlogClient({
  initialPosts,
  categories,
}: {
  initialPosts: BlogPost[];
  categories: BlogCategory[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    if (!selectedCategory) return initialPosts;
    return initialPosts.filter((p) => p.category?.id === selectedCategory);
  }, [selectedCategory, initialPosts]);

  return (
    <main className="min-h-screen bg-[hsl(0,0%,100%)] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[hsl(220,14%,25%)] mb-4">Blog</h1>
          <p className="text-[hsl(220,14%,45%)] max-w-2xl mx-auto">
            Mẹo chăm sóc cây, hướng dẫn và cảm hứng từ thế giới terrarium
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="border-[#c8d5be]"
          >
            Tất Cả
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="border-[#c8d5be]"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[hsl(220,14%,45%)]">Chưa có bài viết nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full">
                  <CardContent className="p-6">
                    {post.category && (
                      <Badge variant="secondary" className="mb-3">
                        <Tag className="w-3 h-3 mr-1" />
                        {post.category.name}
                      </Badge>
                    )}
                    <h3 className="text-xl font-bold text-[hsl(220,14%,25%)] mb-3 group-hover:text-[#425733] transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-[hsl(220,14%,45%)] text-sm line-clamp-3 mb-4">
                      {post.content.substring(0, 150)}...
                    </p>
                    {post.publishedAt && (
                      <div className="flex items-center text-xs text-[hsl(220,14%,45%)]">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(post.publishedAt).toLocaleDateString("vi-VN")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
