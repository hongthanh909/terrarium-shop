"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star, ShoppingBag, Package } from "lucide-react";
import { SaleCountdown } from "@/components/ui/sale-countdown";

export interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  salePrice?: number | null;
  saleEndDate?: string | null;
  images: string[];
  category?: { name: string };
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  className?: string;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  wished?: boolean;
}

export function ProductCard({
  slug,
  name,
  basePrice,
  salePrice,
  saleEndDate,
  images,
  category,
  rating = 0,
  reviewCount = 0,
  isNew,
  isBestseller,
  className,
  onAddToCart,
  onToggleWishlist,
  wished = false,
}: ProductCardProps) {
  // Tính sale: chỉ hiện nếu salePrice < basePrice và chưa hết hạn
  const isOnSale =
    salePrice != null &&
    salePrice < basePrice &&
    (saleEndDate == null || new Date(saleEndDate) > new Date());

  const discountPct = isOnSale
    ? Math.round(((basePrice - salePrice!) / basePrice) * 100)
    : 0;

  const displayPrice = isOnSale ? salePrice! : basePrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "group relative flex flex-col rounded-2xl bg-white p-4 shadow-sm border border-[#e3ebdd]",
        "hover:shadow-lg hover:border-[#b8d8b8] transition-all duration-300 h-full",
        className
      )}
    >
      {/* ── Image area ──────────────────────────── */}
      <Link
        href={`/products/${slug}`}
        className="block relative overflow-hidden rounded-xl bg-gray-50 mb-4 aspect-[4/3] flex-shrink-0"
      >
        {images[0] ? (
          <Image
            src={images[0]}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <Package className="w-12 h-12" />
          </div>
        )}

        {/* ── Badges ─────────────────────────────────────────── */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
          {isOnSale && (
            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-400 text-white text-xs font-bold shadow-md">
              -{discountPct}%
            </span>
          )}
          {isNew && !isOnSale && (
            <span className="px-2 py-0.5 rounded-md bg-[#425733] text-white text-xs font-semibold shadow-sm tracking-wide">
              Mới
            </span>
          )}
          {isBestseller && (
            <span className="px-2 py-0.5 rounded-md bg-[#425733] text-white text-xs font-semibold shadow-sm tracking-wide">
              Bán chạy
            </span>
          )}
        </div>

        {/* ── Wishlist button (optional, keep it on hover) ──────── */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleWishlist?.(); }}
          className={cn(
            "absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-200",
            "opacity-40 sm:opacity-0 sm:group-hover:opacity-100",
            wished
              ? "bg-red-500 text-white scale-100 opacity-100"
              : "bg-white text-gray-400 hover:bg-gray-50 hover:scale-110 active:scale-95"
          )}
          aria-label="Yêu thích"
        >
          <Heart className={cn("w-4 h-4 transition-all", wished && "fill-white text-white")} />
        </button>
      </Link>

      {/* ── Info section ─────────────────────────────────────── */}
      <div className="flex flex-col flex-1">
        {/* Category */}
        <span className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider mb-1 block">
          {category?.name || "SẢN PHẨM"}
        </span>

        {/* Product name */}
        <Link href={`/products/${slug}`} className="block mb-2">
          <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-[#425733] transition-colors leading-snug text-base">
            {name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          {rating > 0 || reviewCount > 0 ? (
            <>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-gray-700">
                {rating > 0 ? rating.toFixed(1) : "5.0"}
              </span>
              <span className="text-xs text-gray-400">
                ({reviewCount})
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-400 italic">Chưa có đánh giá</span>
          )}
        </div>

        {/* Price row */}
        <div className="flex items-center gap-2 mb-4 mt-auto">
          <span className="text-lg font-bold text-[#2d3d23]">
            {displayPrice.toLocaleString("vi-VN")}₫
          </span>
          {isOnSale && (
            <span className="text-sm text-gray-400 line-through">
              {basePrice.toLocaleString("vi-VN")}₫
            </span>
          )}
          {isOnSale && saleEndDate && (
            <SaleCountdown saleEndDate={saleEndDate} className="ml-2" />
          )}
        </div>

        {/* ── Add to cart Button ────────────────── */}
        <button
          onClick={(e) => { e.preventDefault(); onAddToCart?.(); }}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#3a5229] to-[#4a6a35] text-white text-sm font-semibold hover:from-[#2d3d23] hover:to-[#3a5229] transition-all active:scale-[0.98] shadow-[0_4px_14px_rgba(58,82,41,0.25)] hover:shadow-[0_6px_20px_rgba(58,82,41,0.35)]"
        >
          Thêm vào giỏ
        </button>
      </div>
    </motion.div>
  );
}
