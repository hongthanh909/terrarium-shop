"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { showToast } from "@/components/ui/custom-toast";

/**
 * Hook quản lý danh sách yêu thích (wishlist).
 * - Tải danh sách ID sản phẩm đã yêu thích từ API khi đăng nhập.
 * - Cung cấp `isWished(productId)` để check và `toggleWishlist(productId)` để toggle.
 */
export function useWishlist() {
  const { data: session } = useSession();
  const [wishedIds, setWishedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch initial wishlist on login
  useEffect(() => {
    if (!session?.user) {
      setWishedIds(new Set());
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile/favorites");
        if (res.ok) {
          const products = await res.json();
          if (!cancelled) {
            setWishedIds(new Set(products.map((p: any) => p.id)));
          }
        }
      } catch {
        // silently fail
      }
    })();

    return () => { cancelled = true; };
  }, [session?.user]);

  const isWished = useCallback((productId: string) => wishedIds.has(productId), [wishedIds]);

  const toggleWishlist = useCallback(async (productId: string, productName?: string) => {
    if (!session?.user) {
      showToast.warning("Đăng nhập để thêm vào yêu thích!");
      return;
    }

    if (loading) return;
    setLoading(true);

    // Optimistic update
    const wasWished = wishedIds.has(productId);
    setWishedIds((prev) => {
      const next = new Set(prev);
      if (wasWished) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });

    try {
      const res = await fetch(`/api/products/${productId}/vote`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      if (data.voted) {
        showToast.success(productName ? `Đã thêm "${productName}" vào yêu thích ❤️` : "Đã thêm vào yêu thích ❤️");
      } else {
        showToast.success("Đã bỏ yêu thích");
      }
    } catch {
      // Revert optimistic update
      setWishedIds((prev) => {
        const next = new Set(prev);
        if (wasWished) {
          next.add(productId);
        } else {
          next.delete(productId);
        }
        return next;
      });
      showToast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  }, [session?.user, wishedIds, loading]);

  return { isWished, toggleWishlist, wishedIds };
}
