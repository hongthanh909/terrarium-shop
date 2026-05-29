"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, Tag, BookOpen } from "lucide-react";
import { PageTransition } from "@/components/ui/page-transition";
import { motion } from "framer-motion";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
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

  const filteredPosts = useMemo(() => {
    if (!selectedCategory) return initialPosts;
    return initialPosts.filter((p) => p.category?.id === selectedCategory);
  }, [selectedCategory, initialPosts]);

  return (
    <PageTransition>
      <main className="min-h-screen bg-[#fafbf8] py-10 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Hero */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#e3ebdd] px-4 py-2 rounded-full text-sm font-medium text-[#425733] mb-4">
              <BookOpen className="w-4 h-4" />
              <span>Kiến thức terrarium</span>
            </div>
            <h1 className="text-5xl font-bold text-[#1a2e12] mb-4">Blog</h1>
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
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${
                selectedCategory === null
                  ? "bg-[#425733] text-white border-[#425733] shadow-[0_4px_14px_rgba(66,87,51,0.35)]"
                  : "bg-white text-gray-500 border-[#c8d5be] hover:border-[#425733] hover:text-[#425733]"
              }`}
            >
              Tất Cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${
                  selectedCategory === cat.id
                    ? "bg-[#425733] text-white border-[#425733] shadow-[0_4px_14px_rgba(66,87,51,0.35)]"
                    : "bg-white text-gray-500 border-[#c8d5be] hover:border-[#425733] hover:text-[#425733]"
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
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  whileHover={{ y: -4 }}
                >
                  <Link href={`/blog/${post.slug}`} className="block h-full">
                    <div className="group h-full bg-[#f0f4ed] border border-[#d4e4c9] rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(66,87,51,0.08)] hover:shadow-[0_16px_40px_rgba(66,87,51,0.16)] hover:border-[#425733]/40 transition-all duration-300">
                      <div className="h-1 bg-gradient-to-r from-[#425733] via-[#6d8c5a] to-[#425733] opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="p-6">
                        {post.category && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#d4e4c9] text-[#425733] text-[10px] font-semibold uppercase tracking-wider mb-3">
                            <Tag className="w-3 h-3" />
                            {post.category.name}
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-[#1a2e12] mb-3 group-hover:text-[#425733] transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-3 mb-4 leading-relaxed">
                          {post.content.replace(/<[^>]+>/g, "").substring(0, 150)}...
                        </p>
                        {post.publishedAt && (
                          <div className="flex items-center text-xs text-gray-400">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(post.publishedAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
