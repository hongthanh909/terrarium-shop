"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, Heart, Package, ShoppingBasket } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { toast } from "sonner";

interface Product {
  id: string;
  slug: string;
  name: string;
  images: string[];
  basePrice: number | string;
  salePrice?: number | string | null;
  category?: { name: string };
  rating?: number;
  reviewCount?: number;
}

interface HeroCarouselProps {
  products: Product[];
}

export function HeroCarousel({ products }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { addItem } = useCartStore();

  // Auto slide every 6s
  useEffect(() => {
    if (products.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [products.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  }, [products.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  }, [products.length]);

  const handleAddToCart = useCallback((product: Product) => {
    const base = Number(product.basePrice);
    const sale = product.salePrice ? Number(product.salePrice) : null;
    const price = sale != null && sale < base ? sale : base;
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      price,
      quantity: 1,
    });
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng 🛒`);
  }, [addItem]);

  if (!products || products.length === 0) return null;

  // Prepare carousel items: show 3 visible cards
  const getCardAt = (offset: number) => {
    const idx = (currentIndex + offset + products.length) % products.length;
    return products[idx];
  };

  return (
    <div className="relative w-full max-w-[520px] mx-auto py-4">
      {/* Main carousel wrapper */}
      <div className="relative flex items-center justify-center" style={{ minHeight: "480px" }}>
        
        {/* ── Background cards (decorative) ── */}
        {products.length > 1 && (
          <>
            {/* Left background card */}
            <div
              className="absolute w-[280px] rounded-2xl overflow-hidden border border-[#ddeedd] bg-white/60 backdrop-blur-sm cursor-pointer transition-all duration-700 ease-out hover:scale-[1.02]"
              style={{
                height: "420px",
                left: "-20px",
                top: "30px",
                transform: "rotate(-6deg) scale(0.85)",
                opacity: 0.5,
                zIndex: 1,
              }}
              onClick={handlePrev}
            >
              {getCardAt(-1).images[0] && (
                <Image
                  src={getCardAt(-1).images[0]}
                  alt={getCardAt(-1).name}
                  fill
                  className="object-cover blur-[1px] brightness-90"
                  sizes="280px"
                />
              )}
            </div>

            {/* Right background card */}
            <div
              className="absolute w-[280px] rounded-2xl overflow-hidden border border-[#ddeedd] bg-white/60 backdrop-blur-sm cursor-pointer transition-all duration-700 ease-out hover:scale-[1.02]"
              style={{
                height: "420px",
                right: "-20px",
                top: "30px",
                transform: "rotate(5deg) scale(0.88)",
                opacity: 0.55,
                zIndex: 2,
              }}
              onClick={handleNext}
            >
              {getCardAt(1).images[0] && (
                <Image
                  src={getCardAt(1).images[0]}
                  alt={getCardAt(1).name}
                  fill
                  className="object-cover blur-[0.5px] brightness-[0.92]"
                  sizes="280px"
                />
              )}
            </div>
          </>
        )}

        {/* ── Main product card ── */}
        <ProductCardHero
          product={getCardAt(0)}
          onAddToCart={handleAddToCart}
          key={`hero-${getCardAt(0).id}-${currentIndex}`}
        />

        {/* ── Navigation arrows ── */}
        {products.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-10 h-10 bg-white/90 backdrop-blur shadow-lg text-gray-700 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all z-20"
              aria-label="Trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-10 h-10 bg-white/90 backdrop-blur shadow-lg text-gray-700 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all z-20"
              aria-label="Sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* ── Dots indicator ── */}
      {products.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {products.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "bg-[#425733] w-6"
                  : "bg-gray-300 w-2 hover:bg-gray-400"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}


/* ── Individual Product Card (matches featured card style) ── */

function ProductCardHero({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
}) {
  const basePrice = Number(product.basePrice);
  const salePrice = product.salePrice ? Number(product.salePrice) : null;
  const isOnSale = salePrice != null && salePrice < basePrice;
  const discountPct = isOnSale
    ? Math.round(((basePrice - salePrice!) / basePrice) * 100)
    : 0;
  const displayPrice = isOnSale ? salePrice! : basePrice;

  const rating = product.rating ?? 5.0;
  const reviewCount = product.reviewCount ?? 5;

  const getLinkHref = (slug: string) => {
    if (!slug || slug === "#") return "#";
    if (slug.startsWith("/") || slug.startsWith("http")) return slug;
    return `/products/${slug}`;
  };

  return (
    <div
      className="relative w-full max-w-[340px] bg-[#f2f8f2] rounded-2xl overflow-hidden shadow-xl border border-[#ddeedd] flex flex-col animate-in fade-in-0 slide-in-from-right-4 duration-500"
      style={{ zIndex: 10 }}
    >
      {/* ── Image ── */}
      <Link
        href={getLinkHref(product.slug)}
        className="block relative aspect-[4/3] w-full bg-gray-50 overflow-hidden group"
      >
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 400px"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <Package className="w-12 h-12" />
          </div>
        )}

        {/* Sale badge */}
        {isOnSale && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 rounded-lg bg-[#3a5229] text-white text-xs font-bold shadow-md">
              -{discountPct}%
            </span>
          </div>
        )}

        {/* Wishlist button (decorative) */}
        <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
          <Heart className="w-4 h-4 text-gray-400" />
        </div>
      </Link>

      {/* ── Info ── */}
      <div className="p-5 flex flex-col flex-1">
        {/* Category */}
        <span className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider mb-1 block">
          {product.category?.name || "SẢN PHẨM"}
        </span>

        {/* Product name */}
        <Link href={getLinkHref(product.slug)} className="block mb-2">
          <h3 className="font-bold text-gray-900 line-clamp-1 hover:text-[#425733] transition-colors leading-snug text-lg">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-sm font-medium text-gray-700">
            {rating.toFixed(1)}
          </span>
          <span className="text-xs text-gray-400">
            ({reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-4 mt-auto">
          <span className="text-xl font-bold text-[#2d3d23]">
            {displayPrice.toLocaleString("vi-VN")}₫
          </span>
          {isOnSale && (
            <span className="text-sm text-gray-400 line-through">
              {basePrice.toLocaleString("vi-VN")}₫
            </span>
          )}
        </div>

        {/* Add to cart button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onAddToCart(product);
          }}
          className="w-full py-2.5 rounded-lg bg-[#3a5229] text-white text-sm font-semibold hover:bg-[#2d3d23] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBasket className="w-4 h-4" />
          Thêm vào giỏ
        </button>
      </div>
    </div>
  );
}
