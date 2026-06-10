"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { Crop, PixelCrop, PercentCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCropModalProps {
  /** File object or URL string to crop */
  src: string;
  /** Optional aspect ratio (e.g. 16/9, 1, 4/3). Undefined = free crop */
  aspect?: number;
  /** Label shown in modal header */
  title?: string;
  /** Called with the cropped Blob when user confirms */
  onConfirm: (blob: Blob) => void;
  /** Called when user cancels */
  onCancel: () => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export function ImageCropModal({
  src,
  aspect,
  title = "Cắt ảnh",
  onConfirm,
  onCancel,
}: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    if (aspect) {
      setCrop(centerAspectCrop(width, height, aspect));
    } else {
      // Default: select 90% of image
      setCrop(centerCrop(
        { unit: "%", width: 90, height: 90 } as PercentCrop,
        width,
        height
      ));
    }
  }

  const handleConfirm = useCallback(async () => {
    const image = imgRef.current;
    if (!image || !completedCrop) return;

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = Math.floor(completedCrop.width * scaleX);
    canvas.height = Math.floor(completedCrop.height * scaleY);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => { if (blob) onConfirm(blob); },
      "image/jpeg",
      0.92
    );
  }, [completedCrop, onConfirm]);

  // ESC to cancel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[9998] bg-black/80 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="text-base">✂️</span>
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="flex-1 overflow-auto bg-[#1a1a1a] flex items-center justify-center p-4 min-h-[300px]">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            minWidth={50}
            minHeight={50}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              onLoad={onImageLoad}
              style={{ transform: `scale(${scale})`, transformOrigin: "center", maxHeight: "60vh", maxWidth: "100%" }}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        {/* Controls */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-3">
          {/* Zoom */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range" min="0.5" max="3" step="0.05"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="flex-1 accent-[#425733]"
            />
            <button
              onClick={() => setScale((s) => Math.min(3, s + 0.1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScale(1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              title="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-gray-400 w-12 text-right">{Math.round(scale * 100)}%</span>
          </div>

          {/* Hint */}
          <p className="text-xs text-gray-400 text-center">
            Kéo vùng chọn để crop • Kéo góc để thay đổi kích thước • Zoom để xem chi tiết
          </p>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel} className="gap-2">
              <X className="w-4 h-4" />
              Hủy
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!completedCrop}
              className="bg-[#425733] hover:bg-[#364a29] text-white gap-2"
            >
              <Check className="w-4 h-4" />
              Xác nhận cắt ảnh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
