"use client";

import { ProductCard } from "@/components/ui/product-card";
import { useCartStore } from "@/lib/store/cartStore";
import { useWishlist } from "@/lib/hooks/useWishlist";
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
  const { isWished, toggleWishlist } = useWishlist();

  const handleAddToCart = (selectedPackage = "basic", quantity = 1) => {
    const base = props.salePrice != null && props.salePrice < props.basePrice
      ? props.salePrice
      : props.basePrice;

    const isBể = 
      props.category?.name?.toLowerCase().includes("bể") ||
      props.name?.toLowerCase().includes("bể") ||
      props.slug?.toLowerCase().includes("be");

    const pkgPriceAdjustment = isBể
      ? (selectedPackage === "standard" ? 150000 : selectedPackage === "advanced" ? 180000 : 0)
      : 0;

    const price = base + pkgPriceAdjustment;

    const variants: Record<string, string> = {};
    if (isBể) {
      variants["Phân loại"] = selectedPackage === "standard" ? "Gói tiêu chuẩn" :
                              selectedPackage === "advanced" ? "Gói nâng cao" : "Gói cơ bản";
    }

    addItem({
      productId: props.id,
      productName: props.name,
      productImage: props.images[0] || "",
      price,
      quantity,
      variants,
    });
    showToast.success(`Đã thêm "${props.name}" vào giỏ hàng 🛒`);
  };

  return (
    <ProductCard
      {...props}
      onAddToCart={handleAddToCart}
      wished={isWished(props.id)}
      onToggleWishlist={() => toggleWishlist(props.id, props.name)}
    />
  );
}
