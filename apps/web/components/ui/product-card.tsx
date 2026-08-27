// src: apps/web/components/ui/product-card.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Heart, Star, Package, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import { sanitizeProductImages } from "@/lib/product-images";

export interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  salePrice?: number | null;
  saleEndDate?: string | null;
  packageOptionsEnabled?: boolean | null;
  inventory?: number;
  images: string[];
  category?: { name: string };
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  className?: string;
  imageSizes?: string;
  imagePriority?: boolean;
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
  packageOptionsEnabled,
  inventory,
  images,
  category,
  rating = 0,
  reviewCount = 0,
  isNew,
  isBestseller,
  className,
  imageSizes = "(max-width: 639px) 50vw, (max-width: 1023px) 50vw, 25vw",
  imagePriority = false,
  onAddToCart,
  onToggleWishlist,
  wished = false,
}: ProductCardProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const isOutOfStock = inventory !== undefined && inventory <= 0;
  const usableImages = sanitizeProductImages(images);
  const activeImage = usableImages[imageIndex];

  const hasPackageOptions = packageOptionsEnabled !== false;

  const isOnSale =
    salePrice != null &&
    salePrice < basePrice &&
    (saleEndDate == null || new Date(saleEndDate) > new Date());

  const activeBasePrice = isOnSale && salePrice != null ? salePrice : basePrice;

  const discountPct = isOnSale
    ? Math.round(((basePrice - activeBasePrice) / basePrice) * 100)
    : 0;

  const displayPrice = activeBasePrice;

  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-border bg-white shadow-[0_1px_3px_rgba(38,38,38,0.06)] transition-[border-color,box-shadow,transform] duration-200 hover:border-primary-border hover:shadow-floating active:scale-[0.995]",
        className
      )}
    >
      <Link href={`/products/${slug}`} className="relative block aspect-square flex-shrink-0 overflow-hidden bg-muted">
        {activeImage ? (
          <ImageWrapper
            key={activeImage}
            src={activeImage}
            alt={name}
            fill
            sizes={imageSizes}
            priority={imagePriority}
            loading={imagePriority ? "eager" : "lazy"}
            fetchPriority={imagePriority ? "high" : "auto"}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
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
        <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1.5">
          {isOnSale && (
            <span className="rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-destructive shadow-sm backdrop-blur-sm">
              -{discountPct}%
            </span>
          )}
          {isNew && !isOnSale && (
            <span className="rounded-full bg-foreground/90 px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
              Mới
            </span>
          )}
          {isBestseller && (
            <span className="rounded-full bg-foreground/90 px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
              Bán chạy
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); onToggleWishlist?.(); }}
          className={cn(
            "absolute left-2 top-2 z-10 flex h-11 w-11 items-center justify-center transition-[color,transform] duration-150 hover:scale-110 active:scale-95",
            wished
              ? "text-favorite"
              : "text-white hover:text-favorite"
          )}
          aria-label={wished ? `Bỏ ${name} khỏi yêu thích` : `Thêm ${name} vào yêu thích`}
        >
          <Heart className={cn("h-5 w-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)] transition-colors", wished && "fill-current")} />
        </button>
      </Link>

      <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
        <div className="mb-1.5 flex min-w-0 items-center justify-between gap-2 text-[11px] leading-4 text-muted-foreground">
          <span className="truncate font-medium">{category?.name || "Sản phẩm"}</span>
          <span className={cn("shrink-0", isOutOfStock ? "text-destructive" : "text-emerald-700")}>
            {isOutOfStock ? "Hết hàng" : "Còn hàng"}
          </span>
        </div>

        <Link href={`/products/${slug}`} className="min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground transition-colors group-hover:text-primary sm:text-[15px]">
            {name}
          </h3>
        </Link>

        <div className="mt-1.5 flex min-h-5 items-center gap-1">
          {rating > 0 || reviewCount > 0 ? (
            <>
              <Star className="h-3.5 w-3.5 fill-rating text-rating" />
              <span className="text-xs font-semibold text-foreground">
                {rating > 0 ? rating.toFixed(1) : ""}
              </span>
              <span className="text-xs text-muted-foreground">({reviewCount})</span>
            </>
          ) : (
            <span className="text-xs italic text-muted-foreground">Chưa có đánh giá</span>
          )}
        </div>

        <div className="mt-auto grid min-w-0 gap-2 border-t border-border pt-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <span className="block whitespace-nowrap text-sm font-extrabold tabular-nums text-primary sm:text-base">
              {displayPrice.toLocaleString("vi-VN")}₫
            </span>
            {isOnSale && (
              <span className="block whitespace-nowrap text-[11px] font-medium tabular-nums text-muted-foreground line-through">
                {basePrice.toLocaleString("vi-VN")}₫
              </span>
            )}
          </div>

          {hasPackageOptions ? (
            <Link
              href={`/products/${slug}`}
              className="flex h-10 w-full min-w-0 items-center justify-center gap-1.5 rounded-control border border-primary-border bg-primary-soft px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-11 sm:w-auto sm:min-w-11 sm:px-3"
              aria-label={`Chọn phiên bản cho ${name}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Tùy chọn</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (isOutOfStock) return;
                onAddToCart?.("basic", 1);
              }}
              disabled={isOutOfStock}
              className={cn(
                "flex h-10 w-full min-w-0 items-center justify-center gap-1.5 rounded-control border px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-11 sm:w-auto sm:min-w-11 sm:px-3",
                isOutOfStock
                  ? "cursor-not-allowed border-border bg-disabled text-muted-foreground"
                  : "border-primary-border bg-primary-soft text-primary hover:bg-primary/10 active:scale-[0.97]"
              )}
              aria-label={isOutOfStock ? `${name} đã hết hàng` : `Thêm ${name} vào giỏ`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Thêm</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
