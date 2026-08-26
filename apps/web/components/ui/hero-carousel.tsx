"use client";

import { useState, useEffect, useCallback } from "react";
import { ImageWrapper } from "@/components/ui/ImageWrapper";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, Heart, Package, ShoppingBasket } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { showToast } from "@/components/ui/custom-toast";
import { motion } from "framer-motion";
import { getPrimaryProductImage, sanitizeProductImages } from "@/lib/product-images";

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
      productImage: getPrimaryProductImage(product.images),
      price,
      quantity: 1,
    });
    showToast.success(`Đã thêm "${product.name}" vào giỏ hàng 🛒`);
  }, [addItem]);

  if (!products || products.length === 0) return null;

  return (
    <div className="relative w-full max-w-[520px] mx-auto py-4">
      {/* Main carousel wrapper */}
      <div className="relative flex items-center justify-center" style={{ minHeight: "480px" }}>
        
        {/* Render visible products stack */}
        {products.map((product, idx) => {
          let offset = idx - currentIndex;
          if (offset < -Math.floor(products.length / 2)) offset += products.length;
          if (offset > Math.floor(products.length / 2)) offset -= products.length;

          // Only render left background, center active, and right background cards
          const isVisible = offset === 0 || offset === 1 || offset === -1;
          if (!isVisible) return null;

          return (
            <ProductCardHero
              key={product.id}
              product={product}
              offset={offset}
              onAddToCart={handleAddToCart}
              onClickBg={() => {
                if (offset === -1) handlePrev();
                if (offset === 1) handleNext();
              }}
            />
          );
        })}

        {/* ── Navigation arrows ── */}
        {products.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white/90 backdrop-blur shadow-lg text-gray-700 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all z-20"
              aria-label="Trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white/90 backdrop-blur shadow-lg text-gray-700 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all z-20"
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
                  ? "bg-primary w-6"
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


/* ── Animation parameters for 3D stack transition ── */

const cardVariants = {
  center: {
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    opacity: 1,
    zIndex: 10,
    cursor: "default",
  },
  right: {
    x: 95,
    y: 20,
    scale: 0.88,
    rotate: 5,
    opacity: 0.58,
    zIndex: 2,
    cursor: "pointer",
  },
  left: {
    x: -95,
    y: 20,
    scale: 0.85,
    rotate: -6,
    opacity: 0.52,
    zIndex: 1,
    cursor: "pointer",
  },
  hidden: {
    x: 0,
    y: 50,
    scale: 0.7,
    rotate: 0,
    opacity: 0,
    zIndex: 0,
    cursor: "default",
  }
};

function ProductCardHero({
  product,
  offset,
  onAddToCart,
  onClickBg,
}: {
  product: Product;
  offset: number;
  onAddToCart: (p: Product) => void;
  onClickBg: () => void;
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
  const productImages = sanitizeProductImages(product.images);

  const getLinkHref = (slug: string) => {
    if (!slug || slug === "#") return "#";
    if (slug.startsWith("/") || slug.startsWith("http")) return slug;
    return `/products/${slug}`;
  };

  const variant = offset === 0 ? "center" : offset === 1 ? "right" : offset === -1 ? "left" : "hidden";

  return (
    <motion.div
      layout="position"
      variants={cardVariants}
      animate={variant}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="absolute w-full max-w-[320px] bg-white rounded-2xl overflow-hidden shadow-xl border border-[#e3ebdd] flex flex-col hover:shadow-2xl transition-all duration-300"
      onClick={() => {
        if (offset !== 0) onClickBg();
      }}
    >
      {/* ── Image ── */}
      <Link
        href={offset === 0 ? getLinkHref(product.slug) : "#"}
        onClick={(e) => {
          if (offset !== 0) {
            e.preventDefault();
            onClickBg();
          }
        }}
        className="block relative aspect-[4/3] w-full bg-gray-50 overflow-hidden group"
      >
        <motion.div
          animate={{ filter: offset === 0 ? "none" : "blur(1px) brightness(0.9)" }}
          transition={{ duration: 0.35 }}
          className="relative w-full h-full"
        >
          {productImages[0] ? (
            <ImageWrapper
              src={productImages[0]}
              alt={product.name}
              fill
              noRound
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 400px"
              priority={offset === 0}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <Package className="w-12 h-12" />
            </div>
          )}
        </motion.div>

        {/* Sale badge */}
        {isOnSale && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-xs font-bold shadow-md">
              -{discountPct}%
            </span>
          </div>
        )}

        {/* Wishlist button (decorative) */}
        <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
          <Heart className="w-4 h-4 text-gray-400" />
        </div>
      </Link>

      {/* ── Info (Fades out when not center card) ── */}
      <motion.div 
        layout
        animate={{ 
          opacity: offset === 0 ? 1 : 0,
          height: offset === 0 ? "auto" : 0,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        style={{ pointerEvents: offset === 0 ? "auto" : "none" }}
        className="p-5 flex flex-col flex-1 overflow-hidden"
      >
        {/* Category */}
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
          {product.category?.name || "SẢN PHẨM"}
        </span>

        {/* Product name */}
        <Link href={getLinkHref(product.slug)} className="block mb-2">
          <h3 className="font-bold text-gray-900 line-clamp-1 hover:text-primary transition-colors leading-snug text-lg">
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
            <span className="text-sm text-red-500 line-through">
              {basePrice.toLocaleString("vi-VN")}₫
            </span>
          )}
        </div>

        {/* Add to cart button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="w-full py-2.5 rounded-lg bg-[#3a5229] text-white text-sm font-semibold hover:bg-[#2d3d23] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBasket className="w-4 h-4" />
          Thêm vào giỏ
        </button>
      </motion.div>
    </motion.div>
  );
}
