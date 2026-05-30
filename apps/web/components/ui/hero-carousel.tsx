"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  slug: string;
  name: string;
  images: string[];
  basePrice: number | string;
  salePrice?: number | string | null;
  category?: { name: string };
}

interface HeroCarouselProps {
  products: Product[];
}

export function HeroCarousel({ products }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto slide every 5s
  useEffect(() => {
    if (products.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [products.length]);

  if (!products || products.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const currentProduct = products[currentIndex];
  
  // Calculate discount percentage
  const basePrice = Number(currentProduct.basePrice);
  const salePrice = currentProduct.salePrice ? Number(currentProduct.salePrice) : null;
  const discountPercent = salePrice ? Math.round(((basePrice - salePrice) / basePrice) * 100) : 0;

  return (
    <div className="relative w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl overflow-hidden group border border-white/40">
      <Link href={`/products/${currentProduct.slug}`} className="block relative aspect-[4/3] w-full bg-[#f8faf7] overflow-hidden">
        {currentProduct.images[0] ? (
          <Image
            src={currentProduct.images[0]}
            alt={currentProduct.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 600px"
            priority
          />
        ) : (
          <div className="w-full h-full bg-[#e3ebdd]" />
        )}
        
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1 text-sm shadow-md rounded-md">
              -{discountPercent}% Ưu đãi
            </Badge>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-6 bg-white/90 backdrop-blur-sm relative z-10 h-[168px] flex flex-col justify-between">
        <Link href={`/products/${currentProduct.slug}`} className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1 hover:text-[#425733] transition-colors line-clamp-1">
              {currentProduct.name}
            </h3>
            <p className="text-gray-500 text-sm mb-2 line-clamp-1">
              {currentProduct.category?.name || "Hệ sinh thái terrarium cao cấp"}
            </p>
          </div>
          
          <div className="flex flex-col justify-end">
            {salePrice ? (
              <div className="flex flex-col">
                <span className="text-gray-400 line-through text-sm leading-tight">
                  {basePrice.toLocaleString("vi-VN")}₫
                </span>
                <span className="text-2xl font-bold text-blue-600 leading-tight">
                  {salePrice.toLocaleString("vi-VN")}₫
                </span>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-transparent text-sm select-none leading-tight">
                  &nbsp;
                </span>
                <span className="text-2xl font-bold text-blue-600 leading-tight">
                  {basePrice.toLocaleString("vi-VN")}₫
                </span>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Navigation Arrows */}
      {products.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute top-[35%] left-4 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur shadow-md text-gray-800 rounded flex items-center justify-center hover:bg-white transition-all z-20"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute top-[35%] right-4 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur shadow-md text-gray-800 rounded flex items-center justify-center hover:bg-white transition-all z-20"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          
          {/* Dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {products.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentIndex ? "bg-blue-600 w-5" : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
