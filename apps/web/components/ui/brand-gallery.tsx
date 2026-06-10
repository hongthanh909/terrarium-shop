"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface GalleryImage {
  id: string;
  imageUrl: string;
  alt: string;
  order: number;
  isActive: boolean;
}

interface BrandGalleryProps {
  images: GalleryImage[];
}

// Masonry layout: mỗi ảnh được assign vào 1 trong N cột
function distributeToColumns(images: GalleryImage[], cols: number): GalleryImage[][] {
  const columns: GalleryImage[][] = Array.from({ length: cols }, () => []);
  images.forEach((img, i) => {
    columns[i % cols].push(img);
  });
  return columns;
}

export function BrandGallery({ images }: BrandGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [cols, setCols] = useState(3);

  // Responsive columns
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setCols(2);
      else if (window.innerWidth < 1024) setCols(3);
      else setCols(4);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const activeImages = images.filter((img) => img.isActive);
  const columns = distributeToColumns(activeImages, cols);

  // Lightbox navigation
  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % activeImages.length);
  }, [lightboxIndex, activeImages.length]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      (lightboxIndex - 1 + activeImages.length) % activeImages.length
    );
  }, [lightboxIndex, activeImages.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, goNext, goPrev]);

  if (activeImages.length === 0) return null;

  const currentImage = lightboxIndex !== null ? activeImages[lightboxIndex] : null;

  return (
    <>
      {/* Masonry Grid */}
      <div
        className="flex gap-3 md:gap-4"
        style={{ alignItems: "flex-start" }}
      >
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="flex-1 flex flex-col gap-3 md:gap-4">
            {col.map((img, rowIdx) => {
              // Alternate heights for masonry effect
              const globalIdx = activeImages.indexOf(img);
              // Cycle through height classes for visual variety
              const heightPatterns = [
                "aspect-[3/4]",
                "aspect-square",
                "aspect-[4/3]",
                "aspect-[3/4]",
                "aspect-[4/5]",
                "aspect-square",
              ];
              const heightClass =
                heightPatterns[(colIdx * 2 + rowIdx) % heightPatterns.length];

              return (
                <button
                  key={img.id}
                  onClick={() => setLightboxIndex(globalIdx)}
                  className={`relative ${heightClass} w-full rounded-2xl overflow-hidden group cursor-zoom-in shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#425733] focus:ring-offset-2`}
                >
                  <Image
                    src={img.imageUrl}
                    alt={img.alt || "Tiệm Rêu Décor"}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes={`(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw`}
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-[#425733]/0 group-hover:bg-[#425733]/20 transition-all duration-500 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-2.5 shadow-lg">
                      <ZoomIn className="w-5 h-5 text-[#425733]" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {currentImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
            {(lightboxIndex ?? 0) + 1} / {activeImages.length}
          </div>

          {/* Prev */}
          {activeImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentImage.imageUrl}
              alt={currentImage.alt || "Tiệm Rêu Décor"}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Next */}
          {activeImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Alt text */}
          {currentImage.alt && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm text-center max-w-md px-4">
              {currentImage.alt}
            </div>
          )}
        </div>
      )}
    </>
  );
}
