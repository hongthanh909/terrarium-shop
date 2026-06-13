"use client";

import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/**
 * ImageWrapper – drop-in replacement cho next/image.
 *
 * Mặc định giữ nguyên mọi prop của next/image nhưng thêm:
 * - rounded corner mặc định (có thể tắt qua `noRound`)
 * - transition transform mượt mà khi hover
 * - tối ưu quality / placeholder
 *
 * Dùng thay thế `import Image from "next/image"` ở mọi nơi.
 */
export type ImageWrapperProps = ImageProps & {
  /** Tắt rounded mặc định */
  noRound?: boolean;
  /** Container className (chỉ áp dụng khi fill=true) */
  wrapperClassName?: string;
};

export function ImageWrapper({
  className,
  noRound = false,
  wrapperClassName,
  ...props
}: ImageWrapperProps) {
  const roundedClass = noRound ? "" : "rounded-xl";

  // Khi fill=true, cần wrapper div relative
  if (props.fill) {
    return (
      <div className={cn("relative w-full h-full", wrapperClassName)}>
        <Image
          {...props}
          className={cn(
            "object-cover transition-transform duration-500",
            roundedClass,
            className
          )}
        />
      </div>
    );
  }

  return (
    <Image
      {...props}
      className={cn(
        "transition-transform duration-500",
        roundedClass,
        className
      )}
    />
  );
}
