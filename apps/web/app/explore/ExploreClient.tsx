"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Package, Compass, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cartStore";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { PageTransition, SlideInHeading } from "@/components/ui/page-transition";
import { motion } from "framer-motion";

interface Product {
  id: string;
  slug: string;
  name: string;
  basePrice: { toString: () => string };
  salePrice?: { toString: () => string } | null;
  saleEndDate?: string | null;
  images: string[];
  category: { id: string; name: string };
  featured: boolean;
  pinnedUntil: string | null;
  voteCount?: number;
  userVoted?: boolean;
}

interface ExploreProps {
  featured: Product[];
  pinned: Product[];
  topVoted: Product[];
  newArrivals: Product[];
  weeklyFeatured: { product: Product; reason?: string | null } | null;
}

export function ExploreClient({ featured, pinned, topVoted, newArrivals, weeklyFeatured }: ExploreProps) {
  const { addItem } = useCartStore();

  const Section = ({
    title,
    products,
    emptyMessage,
    icon,
  }: {
    title: string;
    products: Product[];
    emptyMessage: string;
    icon?: React.ReactNode;
  }) => (
    <section className="mb-16">
      <SlideInHeading>
        <div className="flex items-center gap-3 mb-6">
          {icon && <span className="text-2xl">{icon}</span>}
          <h2 className="text-2xl font-bold text-[#1a2e12]">{title}</h2>
          <div className="flex-1 h-px bg-[#d4e4c9] ml-2" />
        </div>
      </SlideInHeading>
      {products.length === 0 ? (
        <p className="text-gray-400 py-8 text-center">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              name={product.name}
              basePrice={parseFloat(product.basePrice.toString())}
              salePrice={product.salePrice ? parseFloat(product.salePrice.toString()) : null}
              saleEndDate={product.saleEndDate ?? null}
              images={product.images}
              category={product.category}
              onAddToCart={() => {
                const base = parseFloat(product.basePrice.toString());
                const sale = product.salePrice ? parseFloat(product.salePrice.toString()) : null;
                const price = sale != null && sale < base ? sale : base;
                addItem({ productId: product.id, productName: product.name, productImage: product.images[0] || "", price, quantity: 1, variants: {} });
                toast.success(`Đã thêm "${product.name}" vào giỏ hàng 🛒`);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <PageTransition>
      <main className="min-h-screen bg-[#fafbf8] py-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#e3ebdd] px-4 py-2 rounded-full text-sm font-medium text-[#425733] mb-4">
              <Compass className="w-4 h-4" />
              <span>Khám phá bộ sưu tập</span>
            </div>
            <h1 className="text-5xl font-bold text-[#1a2e12] mb-4">Khám Phá</h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Khám phá bộ sưu tập terrarium tuyệt đẹp — từ sản phẩm nổi bật đến những thiết kế mới nhất
            </p>
          </motion.div>

          {/* Weekly Featured Highlight */}
          {weeklyFeatured && (
            <motion.section
              className="mb-14"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3a5229] via-[#536644] to-[#6b8055] p-8 md:p-12 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-2xl" />
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <Sparkles className="w-4 h-4" />
                    <span>Featured của tuần</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="text-left">
                      <h2 className="text-3xl md:text-4xl font-bold mb-4">{weeklyFeatured.product.name}</h2>
                      {weeklyFeatured.reason && (
                        <p className="text-white/90 mb-6 text-lg">{weeklyFeatured.reason}</p>
                      )}
                      <p className="text-3xl font-bold mb-6">
                        {Number(weeklyFeatured.product.basePrice.toString()).toLocaleString("vi-VN")}₫
                      </p>
                      <div className="flex gap-3">
                        <Button asChild size="lg" className="bg-white text-[#3a5229] hover:bg-gray-100 font-bold shadow-md">
                          <Link href={`/products/${weeklyFeatured.product.slug}`}>Xem chi tiết</Link>
                        </Button>
                        <Button asChild size="lg" className="bg-white/20 border-2 border-white text-white hover:bg-white/30 font-semibold backdrop-blur-sm">
                          <Link href="/products">Xem tất cả</Link>
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm p-4">
                        {weeklyFeatured.product.images.length > 0 ? (
                          <Image src={weeklyFeatured.product.images[0]} alt={weeklyFeatured.product.name} fill sizes="400px" className="object-cover rounded-xl" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="w-20 h-20 text-white/50" /></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          <Section title="Sản Phẩm Nổi Bật" icon="🔥" products={featured} emptyMessage="Chưa có sản phẩm nổi bật" />
          <Section title="Sản Phẩm Được Ghim" icon="📌" products={pinned.filter((p) => p.pinnedUntil && new Date(p.pinnedUntil) > new Date())} emptyMessage="Chưa có sản phẩm được ghim" />
          <Section title="Được Yêu Thích" icon="❤️" products={topVoted} emptyMessage="Chưa có sản phẩm nào được bình chọn" />
          <Section title="Mới Rời Xưởng" icon="🆕" products={newArrivals} emptyMessage="Chưa có sản phẩm mới" />

          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link href="/products">
              <Button variant="outline" className="border-[#c8d5be] hover:bg-[#e3ebdd] hover:border-[#425733] transition-all">
                Xem Tất Cả Sản Phẩm
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
    </PageTransition>
  );
}
