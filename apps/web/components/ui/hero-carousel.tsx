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
  const nextProduct = products[(currentIndex + 1) % products.length] || currentProduct;
  const prevProduct = products[(currentIndex - 1 + products.length) % products.length] || currentProduct;
  
  // Calculate discount percentage
  const basePrice = Number(currentProduct.basePrice);
  const salePrice = currentProduct.salePrice ? Number(currentProduct.salePrice) : null;
  const discountPercent = salePrice ? Math.round(((basePrice - salePrice) / basePrice) * 100) : 0;

  return (
    <div className="relative w-full max-w-lg mx-auto py-8 group/carousel flex items-center justify-center select-none">
      {/* Premium styles for 3D card deck & SVG animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes svg-breath {
          0%, 100% { transform: scale(0.95); opacity: 0.65; }
          50% { transform: scale(1.02); opacity: 0.85; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: rotate(45deg) translateY(0); }
          50% { transform: rotate(45deg) translateY(-6px); }
        }
        @keyframes bounce-delay {
          0%, 100% { transform: rotate(45deg) translateY(0); }
          50% { transform: rotate(45deg) translateY(-3px); }
        }
        @keyframes particle-drift {
          0%, 100% { transform: rotate(45deg) translate(var(--tx), var(--ty)) scale(1); opacity: 0.4; }
          50% { transform: rotate(45deg) translate(calc(var(--tx) + 4px), calc(var(--ty) - 5px)) scale(1.25); opacity: 0.95; }
        }
        @keyframes fade-in {
          0% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        .carousel-glass-layer {
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease, box-shadow 0.8s ease;
        }
        .carousel-image-animate {
          animation: fade-in 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        /* Default states */
        .glass-left {
          transform: translate(-25px, -10px) rotate(-6deg) scale(0.92);
          box-shadow: -10px 15px 30px rgba(0, 0, 0, 0.1);
        }
        .glass-right {
          transform: translate(25px, 10px) rotate(5deg) scale(0.96);
          box-shadow: 10px 15px 30px rgba(0, 0, 0, 0.1);
        }
        .main-carousel-card {
          transform: rotate(-1deg);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
        }
        /* Hover states */
        .group\\/carousel:hover .glass-left {
          transform: translate(-95px, -20px) rotate(-12deg) scale(1.02) !important;
          box-shadow: -25px 30px 50px rgba(0, 0, 0, 0.25);
        }
        .group\\/carousel:hover .glass-right {
          transform: translate(95px, 20px) rotate(12deg) scale(1.02) !important;
          box-shadow: 25px 30px 50px rgba(0, 0, 0, 0.25);
        }
        .group\\/carousel:hover .main-carousel-card {
          transform: rotate(0deg) scale(1.03);
          box-shadow: 0 35px 70px rgba(0, 0, 0, 0.28);
        }
        /* SVG anims */
        .anim-bounce {
          animation: bounce-slow 4s ease-in-out infinite;
          transform-origin: 100px 100px;
        }
        .anim-bounce-delay {
          animation: bounce-delay 4s ease-in-out infinite;
          transform-origin: 100px 100px;
          animation-delay: 1.5s;
        }
        .particle-1 {
          animation: particle-drift 3s ease-in-out infinite;
          --tx: 80px; --ty: 95px;
        }
        .particle-2 {
          animation: particle-drift 4s ease-in-out infinite;
          --tx: 80px; --ty: 55px;
        }
        .particle-3 {
          animation: particle-drift 2.5s ease-in-out infinite;
          --tx: 70px; --ty: 80px;
        }
      `}} />

      {/* Decorative Gold SVG at the very bottom layer */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
        style={{
          zIndex: 0,
        }}
      >
        <div className="absolute w-[240px] h-[240px] bg-gradient-to-tr from-[#d3a410]/20 to-transparent rounded-full blur-3xl opacity-50" />
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 200 200" 
          className="w-[180px] h-[180px] opacity-70 select-none"
          style={{ animation: "svg-breath 6s ease-in-out infinite" }}
        >
          <g style={{ order: -1 }}>
            <polygon
              className="anim-bounce"
              strokeWidth={1}
              stroke="#d3a410"
              fill="none"
              points="70,70 148,50 130,130 50,150"
            />
            <polygon
              className="anim-bounce-delay"
              strokeWidth={1}
              stroke="#d3a410"
              fill="none"
              points="70,70 148,50 130,130 50,150"
            />
            <polygon
              transform="rotate(45 100 100)"
              strokeWidth={2}
              stroke=""
              fill="#2b313a"
              points="70,70 150,50 130,130 50,150"
            />
            <polygon
              strokeWidth={2}
              stroke=""
              fill="url(#gradiente)"
              points="100,70 150,100 100,130 50,100"
            />
            <defs>
              <linearGradient y2="100%" x2="10%" y1="0%" x1="0%" id="gradiente">
                <stop style={{ stopColor: "#1a1c22", stopOpacity: 1 }} offset="20%" />
                <stop style={{ stopColor: "#343a44", stopOpacity: 1 }} offset="60%" />
              </linearGradient>
            </defs>
            <polygon
              transform="translate(20, 31)"
              strokeWidth={2}
              stroke=""
              fill="#b7870f"
              points="80,50 80,75 80,99 40,75"
            />
            <polygon
              transform="translate(20, 31)"
              strokeWidth={2}
              stroke=""
              fill="url(#gradiente2)"
              points="40,-40 80,-40 80,99 40,75"
            />
            <defs>
              <linearGradient y2="100%" x2="0%" y1="-17%" x1="10%" id="gradiente2">
                <stop style={{ stopColor: "#d3a51000", stopOpacity: 1 }} offset="20%" />
                <stop style={{ stopColor: "#d3a51054", stopOpacity: 1 }} offset="100%" id="animatedStop" />
              </linearGradient>
            </defs>
            <polygon
              transform="rotate(180 100 100) translate(20, 20)"
              strokeWidth={2}
              stroke=""
              fill="#d3a410"
              points="80,50 80,75 80,99 40,75"
            />
            <polygon
              transform="rotate(0 100 100) translate(60, 20)"
              strokeWidth={2}
              stroke=""
              fill="url(#gradiente3)"
              points="40,-40 80,-40 80,85 40,110.2"
            />
            <defs>
              <linearGradient y2="100%" x2="10%" y1="0%" x1="0%" id="gradiente3">
                <stop style={{ stopColor: "#d3a51000", stopOpacity: 1 }} offset="20%" />
                <stop style={{ stopColor: "#d3a51054", stopOpacity: 1 }} offset="100%" id="animatedStop" />
              </linearGradient>
            </defs>
            <polygon
              className="particle-1"
              strokeWidth={2}
              stroke=""
              fill="#ffe4a1"
              points="5,0 5,5 0,5 0,0"
            />
            <polygon
              className="particle-2"
              strokeWidth={2}
              stroke=""
              fill="#ccb069"
              points="6,0 6,6 0,6 0,0"
            />
            <polygon
              className="particle-3"
              strokeWidth={2}
              stroke=""
              fill="#fff"
              points="2,0 2,2 0,2 0,0"
            />
            <polygon
              strokeWidth={2}
              stroke=""
              fill="#22252c"
              points="29.5,99.8 100,142 100,172 29.5,130"
            />
            <polygon
              transform="translate(50, 92)"
              strokeWidth={2}
              stroke=""
              fill="#16181d"
              points="50,50 120.5,8 120.5,35 50,80"
            />
          </g>
        </svg>
      </div>

      {/* Decorative Glass Card Left (Layer 10: Prev Product) */}
      <div 
        onClick={handlePrev}
        className="carousel-glass-layer glass-left absolute inset-0 rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden pointer-events-auto cursor-pointer"
        style={{
          zIndex: 10,
        }}
      >
        {prevProduct.images[0] ? (
          <Image
            key={`prev-${prevProduct.id}-${currentIndex}`}
            src={prevProduct.images[0]}
            alt={prevProduct.name}
            fill
            className="object-cover filter blur-[2px] brightness-75 transition-all duration-700 carousel-image-animate"
            sizes="400px"
          />
        ) : (
          <div className="w-full h-full bg-[#e3ebdd]" />
        )}
        {/* Soft elegant green-gray shade for backing depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-[#1a2c12]/30 backdrop-blur-[1px]" />
      </div>

      {/* Decorative Glass Card Right (Layer 20: Next Product) */}
      <div 
        onClick={handleNext}
        className="carousel-glass-layer glass-right absolute inset-0 rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden pointer-events-auto cursor-pointer"
        style={{
          zIndex: 20,
        }}
      >
        {nextProduct.images[0] ? (
          <Image
            key={`next-${nextProduct.id}-${currentIndex}`}
            src={nextProduct.images[0]}
            alt={nextProduct.name}
            fill
            className="object-cover filter blur-[0.5px] brightness-[0.88] transition-all duration-700 carousel-image-animate"
            sizes="400px"
          />
        ) : (
          <div className="w-full h-full bg-[#e3ebdd]" />
        )}
        {/* Soft elegant shade */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-[#2d3d23]/20 backdrop-blur-[0.5px]" />
      </div>

      {/* Main Interactive Product Card (Layer 30) */}
      <div 
        className="carousel-glass-layer main-carousel-card relative w-full bg-white rounded-3xl overflow-hidden border border-white/40 group/main flex flex-col"
        style={{
          zIndex: 30,
        }}
      >
        <Link href={`/products/${currentProduct.slug}`} className="block relative aspect-[4/3] w-full bg-[#f8faf7] overflow-hidden">
          {currentProduct.images[0] ? (
            <Image
              key={`current-${currentProduct.id}-${currentIndex}`}
              src={currentProduct.images[0]}
              alt={currentProduct.name}
              fill
              className="object-cover transition-transform duration-700 group-hover/main:scale-105 carousel-image-animate"
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
    </div>
  );
}
