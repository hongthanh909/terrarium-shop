"use client";

import { ProductCard } from "@/components/ui/product-card";
import { useCartStore } from "@/lib/store/cartStore";
import { showToast } from "@/components/ui/custom-toast";

interface FeaturedProductCardProps {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  salePrice?: number | null;
  saleEndDate?: string | null;
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
    const price = props.salePrice != null && props.salePrice < props.basePrice
      ? props.salePrice
      : props.basePrice;
    addItem({
      productId: props.id,
      productName: props.name,
      productImage: props.images[0] || "",
      price,
      quantity: 1,
    });
    showToast.success(`Đã thêm "${props.name}" vào giỏ hàng 🛒`);
  };

  return (
    <ProductCard
      {...props}
      onAddToCart={handleAddToCart}
    />
  );
}
