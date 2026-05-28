"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star, ShoppingBag, Package } from "lucide-react";

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35 }}
      className={cn(
        // Option C: Green-tinted card — always visible against white bg
        "group relative rounded-2xl overflow-hidden",
        "bg-[#f0f4ed] border border-[#d4e4c9]",
        "shadow-[0_2px_12px_rgba(66,87,51,0.08)]",
        "hover:border-[#425733]/50 hover:shadow-[0_16px_48px_rgba(66,87,51,0.18)]",
        "transition-all duration-300",
        className
      )}
    >
      {/* ── Image area (4:3 ratio) ──────────────────────────── */}
      <Link
        href={`/products/${slug}`}
        className="block relative overflow-hidden bg-[#e3ebdd]"
        style={{ paddingBottom: "75%" /* 4:3 */ }}
      >
        <div className="absolute inset-0">
          {images[0] ? (
            <Image
              src={images[0]}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-107"
              style={{ transform: undefined }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[#a8c49a]">
              <Package className="w-14 h-14" />
            </div>
          )}

          {/* Hover overlay — subtle green tint */}
          <div className="absolute inset-0 bg-[#1a2e12]/0 group-hover:bg-[#1a2e12]/10 transition-colors duration-400 pointer-events-none" />

          {/* ── Add to cart slide-up overlay ────────────────── */}
          <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <button
              onClick={(e) => { e.preventDefault(); onAddToCart?.(); }}
              className="w-full py-3.5 bg-[#2d3d23]/92 backdrop-blur-sm text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1e2e16] transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>

        {/* ── Badges ─────────────────────────────────────────── */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isNew && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#425733] text-white text-[11px] font-bold shadow-sm tracking-wide">
              Mới
            </span>
          )}
          {isBestseller && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-bold shadow-sm">
              🔥 Bán chạy
            </span>
          )}
        </div>

        {/* ── Wishlist button ─────────────────────────────────── */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleWishlist?.(); }}
          className={cn(
            "absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200",
            "opacity-0 group-hover:opacity-100",
            wished
              ? "bg-red-500 text-white scale-100"
              : "bg-white/90 backdrop-blur-sm text-gray-400 hover:bg-white hover:scale-110 active:scale-95"
          )}
          aria-label="Yêu thích"
        >
          <Heart className={cn("w-4 h-4 transition-all", wished && "fill-white text-white")} />
        </button>
      </Link>

      {/* ── Info section ─────────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-4 bg-[#f0f4ed]">
        {/* Category pill */}
        {category && (
          <span className="inline-block px-2 py-0.5 rounded-full bg-[#d4e4c9] text-[#425733] text-[10px] font-semibold uppercase tracking-wider mb-2">
            {category.name}
          </span>
        )}

        {/* Product name */}
        <Link href={`/products/${slug}`}>
          <h3 className="font-semibold text-[#1a2e12] line-clamp-2 group-hover:text-[#425733] transition-colors leading-snug text-sm mb-3">
            {name}
          </h3>
        </Link>

        {/* Price row */}
        <div className="flex items-center justify-between">
          {/* Price badge */}
          <span className="inline-block px-3 py-1 rounded-full bg-[#425733] text-white text-sm font-bold shadow-sm">
            {basePrice.toLocaleString("vi-VN")}₫
          </span>

          {/* Rating — always show stars (filled/empty) */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-3 h-3 transition-colors",
                  star <= Math.round(rating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-300 fill-gray-200"
                )}
              />
            ))}
            {reviewCount > 0 && (
              <span className="text-[10px] text-gray-500 ml-0.5">({reviewCount})</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom green accent bar ───────────────────────────── */}
      <div className="h-0.5 bg-gradient-to-r from-[#425733]/0 via-[#425733]/60 to-[#425733]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
}
