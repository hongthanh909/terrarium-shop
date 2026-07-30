"use client";

import { ProductCard } from "@/components/ui/product-card";
import { useCartStore } from "@/lib/store/cartStore";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { showToast } from "@/components/ui/custom-toast";
import { getProductPackagePriceAdjustment } from "@/lib/product-packages";
import { getPrimaryProductImage, sanitizeProductImages } from "@/lib/product-images";

interface FeaturedProductCardProps {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  salePrice?: number | null;
  saleEndDate?: string | null;
  inventory?: number;
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
    if (props.inventory !== undefined && props.inventory <= 0) {
      showToast.error("Sản phẩm hiện đã hết hàng");
      return;
    }

    const saleIsValid =
      props.salePrice != null &&
      props.salePrice < props.basePrice &&
      (!props.saleEndDate || new Date(props.saleEndDate) > new Date());

    const base = saleIsValid && props.salePrice != null
      ? props.salePrice
      : props.basePrice;

    const isBể = 
      props.category?.name?.toLowerCase().includes("bể") ||
      props.name?.toLowerCase().includes("bể") ||
      props.slug?.toLowerCase().includes("be");

    const pkgPriceAdjustment = isBể
      ? getProductPackagePriceAdjustment(selectedPackage)
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
      productImage: getPrimaryProductImage(props.images),
      price,
      quantity,
      variants,
    });
    showToast.success(`Đã thêm "${props.name}" vào giỏ hàng 🛒`);
  };

  return (
    <ProductCard
      {...props}
      images={sanitizeProductImages(props.images)}
      onAddToCart={handleAddToCart}
      wished={isWished(props.id)}
      onToggleWishlist={() => toggleWishlist(props.id, props.name)}
    />
  );
}
