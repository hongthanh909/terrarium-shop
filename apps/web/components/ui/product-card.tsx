// src: apps/web/components/ui/product-card.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Heart, Star, Package, Minus, Plus } from "lucide-react";
import { SaleCountdown } from "@/components/ui/sale-countdown";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { GlassCard } from "@/components/ui/glass-card";

export interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  salePrice?: number | null;
  saleEndDate?: string | null;
  inventory?: number;
  images: string[];
  category?: { name: string };
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  className?: string;
  onAddToCart?: (selectedPackage: string, quantity: number) => void;
  onToggleWishlist?: () => void;
  wished?: boolean;
}

export function ProductCard({
  slug,
  name,
  basePrice,
  salePrice,
  saleEndDate,
  inventory,
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
  const [selectedPackage, setSelectedPackage] = useState<"basic" | "standard" | "advanced">("basic");
  const [quantity, setQuantity] = useState(1);
  const isOutOfStock = inventory !== undefined && inventory <= 0;

  const isBểProduct =
    category?.name?.toLowerCase().includes("bể") ||
    name?.toLowerCase().includes("bể") ||
    slug?.toLowerCase().includes("be");

  const isOnSale =
    salePrice != null &&
    salePrice < basePrice &&
    (saleEndDate == null || new Date(saleEndDate) > new Date());

  const discountPct = isOnSale
    ? Math.round(((basePrice - salePrice!) / basePrice) * 100)
    : 0;

  const pkgPriceAdjustment = isBểProduct
    ? (selectedPackage === "standard" ? 150000 : selectedPackage === "advanced" ? 180000 : 0)
    : 0;

  const displayPrice = (isOnSale ? salePrice! : basePrice) + pkgPriceAdjustment;

  const prefersReducedMotion = useReducedMotion();

  return (
    <GlassCard
      variant="solid"
      className={cn(
        "group relative flex flex-col p-2.5 sm:p-4 h-full transition-shadow duration-300 hover:shadow-xl cursor-pointer",
        className
      )}
    >
      {/* Image area */}
      <Link href={`/products/${slug}`} className="block relative overflow-hidden rounded-xl sm:rounded-2xl bg-white mb-3 sm:mb-4 aspect-square flex-shrink-0">
        {images[0] ? (
          <ImageWrapper src={images[0]} alt={name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#526248]">
            <Package className="w-12 h-12" />
          </div>
        )}
        {/* Badges */}
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
        {/* Wishlist button */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleWishlist?.(); }}
          className={cn(
            "absolute top-2 left-2 z-10 w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-sm transition-opacity duration-200",
            "opacity-80 sm:opacity-0 sm:group-hover:opacity-100",
            wished
              ? "bg-red-500 text-white scale-100 opacity-100"
              : "bg-white text-[#526248] hover:bg-gray-50 hover:scale-110 active:scale-95"
          )}
          aria-label="Yêu thích"
        >
          <Heart className={cn("w-4 h-4 transition-colors", wished && "fill-white text-white")} />
        </button>
      </Link>

      {/* Info section */}
      <div className="flex flex-col flex-1">
        {/* Category */}
        <span className="text-[#526248] text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-1 block truncate">
          {category?.name || "SẢN PHẨM"}
        </span>

        {/* Name & Price Row */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2 mb-1.5">
          <Link href={`/products/${slug}`} className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-[#425733] transition-colors leading-snug text-sm sm:text-base">
              {name}
            </h3>
          </Link>
          <div className="flex flex-row sm:flex-col items-baseline sm:items-end gap-1 sm:gap-0 flex-shrink-0 sm:pl-1">
            <span className="text-sm sm:text-base font-bold text-[#2d3d23]">
              {displayPrice.toLocaleString("vi-VN")}₫
            </span>
            {isOnSale && (
              <span className="text-[11px] sm:text-xs text-red-500 font-medium line-through">
                {(basePrice + pkgPriceAdjustment).toLocaleString("vi-VN")}₫
              </span>
            )}
            {isOnSale && saleEndDate && (
              <SaleCountdown saleEndDate={saleEndDate} className="mt-1" />
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2 sm:mb-2.5">
          {rating > 0 || reviewCount > 0 ? (
            <>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-gray-700">
                {rating > 0 ? rating.toFixed(1) : ""}
              </span>
              <span className="text-xs text-[#526248]">({reviewCount})</span>
            </>
          ) : (
            <span className="text-xs text-[#526248] italic">Chưa có đánh giá</span>
          )}
        </div>

        {/* Variant Selector */}
        {isBểProduct && (
          <div className="mb-3 sm:mb-4">
            <p className="text-xs font-bold text-[#526248] uppercase tracking-widest mb-1.5">Chọn phiên bản</p>
            <div className="grid grid-cols-3 gap-1">
              {(["basic", "standard", "advanced"] as const).map((key) => {
                const label = key === "basic" ? "Cơ bản" : key === "standard" ? "Tiêu chuẩn" : "Nâng cao";
                const isSelected = selectedPackage === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedPackage(key);
                    }}
                    className={cn(
                      "py-1.5 px-0.5 rounded-lg font-bold text-xs transition-colors duration-200 border-2 text-center leading-tight",
                      isSelected
                        ? "border-[#425733] bg-[#425733] text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:border-[#425733]/50 hover:bg-[#f8faf6]"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity & Add to Cart Row */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          {/* Quantity Selector */}
          <div className="hidden sm:flex items-center bg-[#f3f7ef] rounded-lg border border-[#e3ebdd] overflow-hidden p-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setQuantity((q) => Math.max(1, q - 1));
              }}
              disabled={isOutOfStock}
              aria-label="Giảm số lượng"
              className="w-7 h-7 flex items-center justify-center text-[#425733] hover:bg-[#d4dec9] rounded transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center text-xs font-bold text-gray-800 select-none">
              {quantity}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setQuantity((q) => inventory ? Math.min(inventory, q + 1) : q + 1);
              }}
              disabled={isOutOfStock || (inventory !== undefined && quantity >= inventory)}
              aria-label="Tăng số lượng"
              className="w-7 h-7 flex items-center justify-center text-[#425733] hover:bg-[#d4dec9] rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (isOutOfStock) return;
              onAddToCart?.(isBểProduct ? selectedPackage : "basic", quantity);
            }}
            disabled={isOutOfStock}
            className={cn(
              "flex-1 min-h-10 py-2 px-2 sm:px-3 rounded-lg text-white text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5",
              isOutOfStock
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-[#3a5229] to-[#4a6a35] hover:from-[#2d3d23] hover:to-[#3a5229] active:scale-[0.97]",
              "shadow-[0_2px_8px_rgba(58,82,41,0.15)] hover:shadow-[0_4px_12px_rgba(58,82,41,0.25)]"
            )}
          >
            {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
