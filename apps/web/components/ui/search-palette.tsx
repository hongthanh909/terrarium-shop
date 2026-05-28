"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, FileText, X, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

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

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults(null); return; }
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
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            key="palette"
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed top-[10vh] left-1/2 -translate-x-1/2 z-[61] w-full max-w-2xl px-4"
          >
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: "rgba(18,24,18,0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {/* Input */}
              <form onSubmit={handleSubmit} className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                {loading ? (
                  <Loader2 className="w-5 h-5 text-[#6d8c5a] flex-shrink-0 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
                )}
                <input
                  ref={inputRef}
                  value={query}
                  onChange={handleChange}
                  placeholder="Tìm sản phẩm, bài viết..."
                  className="flex-1 bg-transparent text-white placeholder:text-white/30 text-base focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-white/10 text-white/40 text-xs font-mono border border-white/10">
                    ESC
                  </kbd>
                  {query && (
                    <button type="button" onClick={() => { setQuery(""); setResults(null); inputRef.current?.focus(); }} className="text-white/30 hover:text-white/60 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {!query && (
                  <div className="px-5 py-8 text-center text-white/25 text-sm">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    Nhập để tìm kiếm sản phẩm và bài viết
                  </div>
                )}

                {query && !loading && !hasResults && query.length >= 2 && (
                  <div className="px-5 py-8 text-center text-white/30 text-sm">
                    Không tìm thấy kết quả cho &ldquo;<span className="text-white/50">{query}</span>&rdquo;
                  </div>
                )}

                {hasResults && (
                  <div className="py-3">
                    {/* Products */}
                    {results!.products.length > 0 && (
                      <div>
                        <div className="px-5 py-2 flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-[#6d8c5a]" />
                          <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Sản phẩm</span>
                        </div>
                        {results!.products.map((p) => (
                          <Link
                            key={p.id}
                            href={`/products/${p.slug}`}
                            onClick={onClose}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                              {p.images[0] ? (
                                <Image src={p.images[0]} alt={p.name} width={40} height={40} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">🌿</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white/90 text-sm font-medium truncate">{p.name}</p>
                              <p className="text-white/35 text-xs">{p.category?.name} · {Number(p.basePrice).toLocaleString("vi-VN")}₫</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-[#6d8c5a] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Blog posts */}
                    {results!.posts.length > 0 && (
                      <div className={results!.products.length > 0 ? "border-t border-white/10 mt-2 pt-2" : ""}>
                        <div className="px-5 py-2 flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-[#6d8c5a]" />
                          <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Bài viết</span>
                        </div>
                        {results!.posts.map((post) => (
                          <Link
                            key={post.id}
                            href={`/blog/${post.slug}`}
                            onClick={onClose}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-[#425733]/30 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-[#6d8c5a]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white/90 text-sm font-medium truncate">{post.title}</p>
                              {post.publishedAt && (
                                <p className="text-white/35 text-xs">{new Date(post.publishedAt).toLocaleDateString("vi-VN")}</p>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-[#6d8c5a] transition-all flex-shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* View all */}
                    {query && (
                      <div className="px-5 pt-2 pb-3 border-t border-white/10 mt-2">
                        <Link
                          href={`/products?search=${encodeURIComponent(query)}`}
                          onClick={onClose}
                          className="flex items-center justify-center gap-2 w-full py-2 text-sm text-[#6d8c5a] hover:text-[#8fba6f] transition-colors"
                        >
                          <Search className="w-4 h-4" />
                          Xem tất cả kết quả cho &ldquo;{query}&rdquo;
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="px-5 py-2.5 border-t border-white/8 flex items-center gap-4 text-[11px] text-white/25">
                <span><kbd className="font-mono">↵</kbd> mở</span>
                <span><kbd className="font-mono">ESC</kbd> đóng</span>
                <span className="ml-auto">🌿 Tiệm Rêu Décor</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Trigger button to open the palette */
export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 hover:bg-[#e3ebdd]/80 border border-transparent hover:border-[#c2d6b0] text-sm text-gray-400 hover:text-[#425733] transition-all duration-200 group"
    >
      <Search className="w-3.5 h-3.5" />
      <span className="text-xs">Tìm kiếm</span>
      <kbd className="ml-1 text-[10px] font-mono bg-black/5 px-1.5 py-0.5 rounded border border-gray-200 group-hover:border-[#c2d6b0]">
        ⌘K
      </kbd>
    </button>
  );
}
