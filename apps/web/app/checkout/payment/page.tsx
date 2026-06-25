"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CheckoutPaymentPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  return (
    <main className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-lg mx-auto space-y-6">
        <Card className="text-center border-yellow-200">
          <CardHeader>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-yellow-700">Thanh Toán Chưa Hoàn Tất</CardTitle>
            <CardDescription className="mt-2 text-base">
              Đơn hàng đã được tạo nhưng thanh toán bị hủy hoặc chưa thành công.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderNumber && (
              <div className="bg-yellow-50 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Mã đơn hàng</p>
                <p className="font-mono text-lg font-bold text-yellow-700">{orderNumber}</p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Bạn có thể vào mục &ldquo;Đơn Hàng&rdquo; để xem lại và liên hệ shop nếu cần hỗ trợ thanh toán.
            </p>

            <div className="pt-4 space-y-3">
              <Button className="w-full" asChild>
                <Link href="/orders" className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Xem Đơn Hàng
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/products" className="flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Quay Lại Cửa Hàng
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
