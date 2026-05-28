"use client";

import { ProductCard } from "@/components/ui/product-card";
import { useCartStore } from "@/lib/store/cartStore";
import { toast } from "sonner";

interface FeaturedProductCardProps {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  images: string[];
  category?: { name: string };
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
}

export function FeaturedProductCard(props: FeaturedProductCardProps) {
  const { addItem } = useCartStore();

  const handleAddToCart = () => {
    addItem({
      productId: props.id,
      productName: props.name,
      productImage: props.images[0] || "",
      price: props.basePrice,
      quantity: 1,
    });
    toast.success(`Đã thêm "${props.name}" vào giỏ hàng 🛒`);
  };

  return (
    <ProductCard
      {...props}
      onAddToCart={handleAddToCart}
    />
  );
}
