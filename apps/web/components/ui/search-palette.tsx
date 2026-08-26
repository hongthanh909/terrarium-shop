"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, FileText, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics-client";

interface SearchResult {
  products: Array<{ id: string; slug: string; name: string; basePrice: string; images: string[]; category: { name: string } }>;
  posts: Array<{ id: string; slug: string; title: string; publishedAt: string | null }>;
}

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults(null); return; }
    trackEvent({ type: "SEARCH", searchTerm: q.trim(), path: "/search" });
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const hasResults = results && (results.products.length > 0 || results.posts.length > 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — blur nhẹ */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Palette — WHITE */}
          <motion.div
            key="palette"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-[12vh] left-0 right-0 z-[61] flex justify-center px-4"
          >
            <div className="w-full max-w-[640px] rounded-2xl overflow-hidden bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-gray-100">

              {/* Input */}
              <form onSubmit={handleSubmit} className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <input
                  ref={inputRef}
                  value={query}
                  onChange={handleChange}
                  placeholder="Tìm sản phẩm, bài viết..."
                  className="flex-1 bg-transparent text-gray-800 placeholder:text-gray-400 text-base focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-400 text-xs font-mono border border-gray-200">
                    ESC
                  </kbd>
                  {query && (
                    <button
                      type="button"
                      onClick={() => { setQuery(""); setResults(null); inputRef.current?.focus(); }}
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {!query && (
                  <div className="px-5 py-10 text-center text-gray-300">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nhập để tìm kiếm sản phẩm và bài viết</p>
                  </div>
                )}

                {query && !loading && !hasResults && query.length >= 2 && (
                  <div className="px-5 py-10 text-center text-gray-400 text-sm">
                    Không tìm thấy kết quả cho &ldquo;<span className="text-gray-600 font-medium">{query}</span>&rdquo;
                  </div>
                )}

                {hasResults && (
                  <div className="py-2">
                    {/* Products */}
                    {results!.products.length > 0 && (
                      <div>
                        <div className="px-5 py-2 flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-primary" />
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Sản phẩm</span>
                        </div>
                        {results!.products.map((p) => (
                          <Link
                            key={p.id}
                            href={`/products/${p.slug}`}
                            onClick={onClose}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-primary-soft transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                              {p.images[0] ? (
                                <ImageWrapper src={p.images[0]} alt={p.name} width={40} height={40} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">🌿</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-800 text-sm font-medium truncate">{p.name}</p>
                              <p className="text-gray-400 text-xs">{p.category?.name} · {Number(p.basePrice).toLocaleString("vi-VN")}₫</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-200 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Blog posts */}
                    {results!.posts.length > 0 && (
                      <div className={results!.products.length > 0 ? "border-t border-gray-100 mt-1 pt-1" : ""}>
                        <div className="px-5 py-2 flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Bài viết</span>
                        </div>
                        {results!.posts.map((post) => (
                          <Link
                            key={post.id}
                            href={`/blog/${post.slug}`}
                            onClick={onClose}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-[#f5f7f4] transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-800 text-sm font-medium truncate">{post.title}</p>
                              {post.publishedAt && (
                                <p className="text-gray-400 text-xs">{new Date(post.publishedAt).toLocaleDateString("vi-VN")}</p>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-200 group-hover:text-primary transition-all flex-shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* View all */}
                    {query && (
                      <div className="px-5 pt-2 pb-3 border-t border-gray-100 mt-1">
                        <Link
                          href={`/products?search=${encodeURIComponent(query)}`}
                          onClick={onClose}
                          className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                        >
                          <Search className="w-4 h-4" />
                          Xem tất cả kết quả cho &ldquo;{query}&rdquo;
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-2.5 border-t border-gray-100 flex items-center gap-4 text-[11px] text-gray-300">
                <span><kbd className="font-mono text-gray-400">↵</kbd> mở</span>
                <span><kbd className="font-mono text-gray-400">ESC</kbd> đóng</span>
                <span className="ml-auto text-primary/50 font-medium" style={{ fontFamily: "'Dancing Script', cursive" }}>tiệm Rêu Décor</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Trigger button for navbar — icon only (magnifying glass, no text, no shortcut) */
export function SearchTrigger({ onClick, light = false }: { onClick: () => void; light?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label="Mở tìm kiếm"
      className={`hidden md:flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
        light
          ? "bg-white/15 hover:bg-white/25 text-white/70 hover:text-white"
          : "bg-black/5 hover:bg-primary-soft/80 text-gray-400 hover:text-primary"
      }`}
    >
      <Search className="w-4 h-4" />
    </button>
  );
}
