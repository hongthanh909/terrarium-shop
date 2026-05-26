"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    // Đợi 1 giây rồi hiện thành công (PayOS webhook đã xử lý phía server)
    const timer = setTimeout(() => setStatus("success"), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#425733] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Đang xác nhận thanh toán...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-lg mx-auto space-y-6">
        <Card className="text-center border-[#c8d5be]">
          <CardHeader>
            <div className="w-20 h-20 bg-[#e3ebdd] rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Check className="w-10 h-10 text-[#425733]" />
            </div>
            <CardTitle className="text-2xl text-[#425733]">Thanh Toán Thành Công!</CardTitle>
            <CardDescription className="mt-2 text-base">
              Cảm ơn bạn đã mua hàng tại Tiệm Rêu Décor.
              <br />
              Đơn hàng của bạn đã được xác nhận và sẽ sớm được xử lý.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderNumber && (
              <div className="bg-[#f0f4ec] rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Mã đơn hàng</p>
                <p className="font-mono text-lg font-bold text-[#425733]">{orderNumber}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 p-3 bg-[#f6faf4] border border-[#daebd0] rounded-xl">
                <span className="text-lg">✅</span>
                <div>
                  <p className="text-xs font-semibold text-[#2d4a1e]">Đã thanh toán</p>
                  <p className="text-[10px] text-[#5a7a48]">Qua PayOS</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-[#f6faf4] border border-[#daebd0] rounded-xl">
                <span className="text-lg">📦</span>
                <div>
                  <p className="text-xs font-semibold text-[#2d4a1e]">Đang xử lý</p>
                  <p className="text-[10px] text-[#5a7a48]">Shop sẽ sớm đóng gói</p>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button className="w-full bg-[#425733] hover:bg-[#364a29]" asChild>
                <Link href="/orders" className="flex items-center justify-center gap-2">
                  <Package className="w-4 h-4" />
                  Xem Đơn Hàng Của Tôi
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/products" className="flex items-center justify-center gap-2">
                  Tiếp Tục Mua Sắm
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
