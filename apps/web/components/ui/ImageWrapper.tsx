import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageWrapperProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageWrapper({ src, alt, className = '' }: ImageWrapperProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-white mb-4 aspect-square flex-shrink-0', className)}>
      <Image src={src} alt={alt} fill className="object-cover transition-transform duration-500" />
    </div>
  );
}
