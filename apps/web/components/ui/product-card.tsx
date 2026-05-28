"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star, ShoppingBag } from "lucide-react";

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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative bg-white rounded-2xl border border-transparent shadow-sm overflow-hidden",
        "hover:border-[#425733]/30 hover:shadow-[0_8px_30px_rgba(66,87,51,0.18)]",
        "transition-all duration-300",
        className
      )}
    >
      {/* Image area */}
      <Link href={`/products/${slug}`} className="block relative aspect-square overflow-hidden bg-[#f4f7f2]">
        {images[0] ? (
          <Image
            src={images[0]}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">🌿</div>
        )}

        {/* Green glow overlay on hover */}
        <div className="absolute inset-0 bg-[#425733]/0 group-hover:bg-[#425733]/5 transition-colors duration-300 pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isNew && (
            <span className="px-2 py-0.5 rounded-full bg-[#425733] text-white text-[11px] font-semibold shadow">
              Mới
            </span>
          )}
          {isBestseller && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-semibold shadow">
              Bán chạy
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleWishlist?.(); }}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            "hover:bg-white hover:scale-110 active:scale-95"
          )}
          aria-label="Yêu thích"
        >
          <Heart className={cn("w-4 h-4 transition-colors", wished ? "fill-red-500 text-red-500" : "text-gray-400")} />
        </button>

        {/* Add to cart — appears on hover */}
        <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={(e) => { e.preventDefault(); onAddToCart?.(); }}
            className="w-full py-3 bg-[#425733] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#364a29] transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Thêm vào giỏ
          </button>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        {category && (
          <span className="text-[11px] font-medium text-[#6d8c5a] uppercase tracking-wider">{category.name}</span>
        )}
        <Link href={`/products/${slug}`}>
          <h3 className="mt-0.5 font-semibold text-gray-800 line-clamp-2 group-hover:text-[#425733] transition-colors leading-snug text-sm">
            {name}
          </h3>
        </Link>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-bold text-[#425733]">
            {basePrice.toLocaleString("vi-VN")}₫
          </span>
          {rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-gray-500 font-medium">{rating.toFixed(1)}</span>
              {reviewCount > 0 && <span className="text-xs text-gray-400">({reviewCount})</span>}
            </div>
          )}
        </div>
      </div>

      {/* Glow ring — visible on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 ring-[#425733]/25 transition-all duration-300" />
    </motion.div>
  );
}
