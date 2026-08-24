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
import { getProductPackagePriceAdjustment } from "@/lib/product-packages";
import { sanitizeProductImages } from "@/lib/product-images";

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
  const [imageIndex, setImageIndex] = useState(0);
  const isOutOfStock = inventory !== undefined && inventory <= 0;
  const usableImages = sanitizeProductImages(images);
  const activeImage = usableImages[imageIndex];

  const isBểProduct =
    category?.name?.toLowerCase().includes("bể") ||
    name?.toLowerCase().includes("bể") ||
    slug?.toLowerCase().includes("be");

  const isOnSale =
    salePrice != null &&
    salePrice < basePrice &&
    (saleEndDate == null || new Date(saleEndDate) > new Date());

  const pkgPriceAdjustment = isBểProduct
    ? getProductPackagePriceAdjustment(selectedPackage)
    : 0;

  const activeBasePrice = isOnSale && salePrice != null ? salePrice : basePrice;
  const adjustedBase = basePrice + pkgPriceAdjustment;
  const adjustedSale = activeBasePrice + pkgPriceAdjustment;

  const discountPct = isOnSale
    ? Math.round(((adjustedBase - adjustedSale) / adjustedBase) * 100)
    : 0;

  const displayPrice = adjustedSale;

  const prefersReducedMotion = useReducedMotion();

  return (
    <GlassCard
      variant="solid"
      className={cn(
        "group relative flex h-full cursor-pointer flex-col p-2.5 transition-shadow duration-200 hover:shadow-lg sm:p-4",
        className
      )}
    >
      {/* Image area */}
      <Link href={`/products/${slug}`} className="relative mb-3 block aspect-square flex-shrink-0 overflow-hidden rounded-md bg-muted sm:mb-4">
        {activeImage ? (
          <ImageWrapper
            key={activeImage}
            src={activeImage}
            alt={name}
            fill
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => {
              setImageIndex((current) => Math.min(current + 1, usableImages.length));
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted px-4 text-center text-muted-foreground">
            <Package className="w-10 h-10" />
            <span className="text-xs font-medium">Ảnh đang được cập nhật</span>
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
            <span className="rounded-md bg-foreground px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
              Mới
            </span>
          )}
          {isBestseller && (
            <span className="rounded-md bg-foreground px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
              Bán chạy
            </span>
          )}
        </div>
        {/* Wishlist button */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleWishlist?.(); }}
          className={cn(
            "absolute left-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition-opacity duration-200 sm:h-11 sm:w-11",
            "opacity-80 sm:opacity-0 sm:group-hover:opacity-100",
            wished
              ? "bg-red-500 text-white scale-100 opacity-100"
              : "bg-white text-muted-foreground hover:bg-muted active:scale-95"
          )}
          aria-label="Yêu thích"
        >
          <Heart className={cn("w-4 h-4 transition-colors", wished && "fill-white text-white")} />
        </button>
      </Link>

      {/* Info section */}
      <div className="flex flex-col flex-1">
        {/* Category */}
        <span className="mb-1 block truncate text-[11px] font-semibold uppercase text-muted-foreground sm:text-xs">
          {category?.name || "SẢN PHẨM"}
        </span>

        {/* Name & Price Row */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2 mb-1.5">
          <Link href={`/products/${slug}`} className="flex-1 min-w-0">
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-foreground/70 sm:text-base">
              {name}
            </h3>
          </Link>
          <div className="flex flex-row sm:flex-col items-baseline sm:items-end gap-1 sm:gap-0 flex-shrink-0 sm:pl-1">
            <span className="text-sm font-bold text-foreground sm:text-base">
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
              <span className="text-xs text-muted-foreground">({reviewCount})</span>
            </>
          ) : (
            <span className="text-xs italic text-muted-foreground">Chưa có đánh giá</span>
          )}
        </div>

        {/* Variant Selector */}
        {isBểProduct && (
          <div className="mb-3 sm:mb-4">
            <p className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Chọn phiên bản</p>
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
                      "min-h-11 rounded-md border px-0.5 py-1.5 text-center text-xs font-bold leading-tight transition-colors duration-200",
                      isSelected
                        ? "border-foreground bg-foreground text-white shadow-sm"
                        : "border-border bg-white text-muted-foreground hover:border-foreground/30 hover:bg-muted"
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
          <div className="hidden flex-shrink-0 items-center overflow-hidden rounded-md border border-border bg-muted p-0.5 sm:flex">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setQuantity((q) => Math.max(1, q - 1));
              }}
              disabled={isOutOfStock}
              aria-label="Giảm số lượng"
              className="flex h-9 w-9 items-center justify-center rounded text-foreground transition-colors hover:bg-white"
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
              className="flex h-9 w-9 items-center justify-center rounded text-foreground transition-colors hover:bg-white"
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
              "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-bold text-white transition-colors sm:px-3 sm:text-sm",
              isOutOfStock
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-foreground hover:bg-foreground/85 active:scale-[0.97]",
              "shadow-[0_2px_8px_rgba(25,28,24,0.12)] hover:shadow-[0_4px_12px_rgba(25,28,24,0.18)]"
            )}
          >
            {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
