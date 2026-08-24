"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Tag, BookOpen, ImageOff } from "lucide-react";
import { PageTransition } from "@/components/ui/page-transition";
import { motion, useReducedMotion } from "framer-motion";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  thumbnail: string | null;
  published: boolean;
  publishedAt: string | null;
  category: { id: string; slug: string; name: string } | null;
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
  const prefersReducedMotion = useReducedMotion();

  const filteredPosts = useMemo(() => {
    if (!selectedCategory) return initialPosts;
    return initialPosts.filter((p) => p.category?.id === selectedCategory);
  }, [selectedCategory, initialPosts]);

  return (
    <PageTransition>
      <div className="min-h-[100dvh] bg-white px-4 py-12 sm:px-6">
        <div className="max-w-7xl mx-auto">

          {/* Hero */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground">
              <BookOpen className="w-4 h-4" />
              <span>Kiến thức terrarium</span>
            </div>
            <h1 className="mb-4 font-serif text-5xl font-semibold text-foreground sm:text-6xl">Nhật ký Tiệm Rêu</h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Mẹo chăm sóc cây, hướng dẫn và cảm hứng từ thế giới terrarium
            </p>
          </motion.div>

          {/* Category Filters */}
          <motion.div
            className="flex items-center gap-2 mb-10 flex-wrap justify-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <button
              onClick={() => setSelectedCategory(null)}
              className={`min-h-11 border px-5 py-2 text-sm font-semibold transition-colors duration-200 ${
                selectedCategory === null
                  ? "border-foreground bg-foreground text-white"
                  : "border-border bg-white text-gray-500 hover:border-foreground hover:text-foreground"
              }`}
            >
              Tất Cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-11 border px-5 py-2 text-sm font-semibold transition-colors duration-200 ${
                  selectedCategory === cat.id
                    ? "border-foreground bg-foreground text-white"
                    : "border-border bg-white text-gray-500 hover:border-foreground hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </motion.div>

          {/* Blog Posts Grid */}
          {filteredPosts.length === 0 ? (
            <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <BookOpen className="w-16 h-16 mx-auto text-[#a8c49a] mb-4" />
              <p className="text-gray-400">Chưa có bài viết nào.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                >
                  <Link href={`/blog/${post.slug}`} className="block h-full">
                    <article className="group h-full overflow-hidden border border-border bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
                      
                      {/* Thumbnail Image */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                        {post.thumbnail ? (
                          <Image
                            src={post.thumbnail}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <ImageOff className="w-10 h-10 mx-auto text-[#a8c49a] mb-2" />
                              <p className="text-xs text-[#7a9b6a]">Chưa có ảnh</p>
                            </div>
                          </div>
                        )}
                        {/* Category overlay badge */}
                        {post.category && (
                          <span className="absolute left-3 top-3 inline-flex items-center gap-1 border border-white/50 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase text-foreground shadow-sm backdrop-blur-sm">
                            <Tag className="w-3 h-3" />
                            {post.category.name}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="mb-2 line-clamp-2 font-serif text-xl font-semibold leading-snug text-foreground transition-colors group-hover:text-foreground/70">
                          {post.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                          {(post.content || "").replace(/<[^>]+>/g, "").substring(0, 120)}...
                        </p>
                        <div className="flex items-center justify-between">
                          {post.publishedAt && (
                            <div className="flex items-center text-xs text-gray-400">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(post.publishedAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                            </div>
                          )}
                          <span className="text-xs font-semibold text-foreground group-hover:underline">
                            Đọc thêm
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
