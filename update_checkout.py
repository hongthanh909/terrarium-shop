import re

with open('apps/web/app/checkout/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    'import { ArrowLeft, CreditCard, Truck, Check, Tag, X } from "lucide-react";',
    'import { ArrowLeft, CreditCard, Truck, Check, Tag, X, Clock, Copy, AlertTriangle, CheckCircle2 } from "lucide-react";\nimport { useEffect, useCallback } from "react";'
)

# 2. States
states_to_add = """  const [orderNumber, setOrderNumber] = useState("");
  const [finalItems, setFinalItems] = useState<CartItem[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID" | "EXPIRED">("PENDING");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const TOTAL_SECONDS = 30 * 60;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const checkStatus = useCallback(async () => {
    if (!orderId || paymentStatus !== "PENDING" || formData.paymentMethod !== "BANK_TRANSFER") return;
    try {
      const res = await fetch(`/api/orders/${orderId}/status`);
      const data = await res.json();
      if (data.paymentStatus === "PAID") {
        setPaymentStatus("PAID");
        return;
      }
      if (data.expired || data.status === "CANCELLED") {
        setPaymentStatus("EXPIRED");
        return;
      }
      if (data.remainingSeconds !== undefined) {
        setSecondsLeft(data.remainingSeconds);
      }
    } catch (e) {
      console.error("Error checking payment status:", e);
    }
  }, [orderId, paymentStatus, formData.paymentMethod]);

  useEffect(() => {
    if (!orderCreated || formData.paymentMethod !== "BANK_TRANSFER" || paymentStatus !== "PENDING") return;
    checkStatus();
    const interval = setInterval(checkStatus, 12000);
    return () => clearInterval(interval);
  }, [orderCreated, formData.paymentMethod, paymentStatus, checkStatus]);

  useEffect(() => {
    if (!orderCreated || secondsLeft === null || paymentStatus !== "PENDING") return;
    if (secondsLeft <= 0) {
      setPaymentStatus("EXPIRED");
      return;
    }
    const timer = setTimeout(() => setSecondsLeft(s => (s ?? 0) - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, paymentStatus, orderCreated]);
"""
content = re.sub(
    r'(const \[finalDiscount, setFinalDiscount\] = useState\(0\);)',
    r'\1\n' + states_to_add,
    content
)

# 3. handleSubmit
start_idx_hs = content.find('      // Bước 2: Nếu chọn Chuyển khoản')
end_idx_hs = content.find('    } catch (error) {')
if start_idx_hs != -1 and end_idx_hs != -1:
    new_hs = """      // Chung cho cả COD và BANK_TRANSFER (hiển thị trên cùng trang)
      setOrderId(order.id);
      setOrderNumber(order.orderNumber);
      setFinalTotal(total);
      setFinalSubtotal(subtotal);
      setFinalShippingFee(shippingFee);
      setFinalDiscount(discount);
      setFinalItems([...items]);
      setPaymentStatus("PENDING");
      setOrderCreated(true);
      clearCart();

"""
    content = content[:start_idx_hs] + new_hs + content[end_idx_hs:]
else:
    print("Could not find handle_submit block")

# 4. orderCreated view
start_idx_oc = content.find('  if (orderCreated) {')
end_idx_oc = content.rfind('  if (items.length === 0) {')

order_created_new = """  if (orderCreated) {
    const bankName = "KienLongBank";
    const bankAccount = "101499100004612299";
    const bankOwner = "NGUYEN THANH HONG";
    const bankBin = "970452"; // KienLong BIN
    const transferAmount = finalTotal;
    const transferContent = `TT ${orderNumber ? orderNumber.slice(-8).toUpperCase() : orderId.slice(-8).toUpperCase()}`;
    const qrUrl = `https://img.vietqr.io/image/${bankBin}-${bankAccount}-compact2.png?amount=${transferAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankOwner)}`;

    const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : 30;
    const seconds = secondsLeft !== null ? secondsLeft % 60 : 0;
    const isUrgent = secondsLeft !== null && secondsLeft < 300;

    const STATUS_STEPS = [
      { key: "PENDING",    label: "Chờ xác nhận",  desc: "Đơn hàng đã được tiếp nhận" },
      { key: "CONFIRMED",  label: "Đã xác nhận",   desc: "Shop đã xác nhận đơn" },
      { key: "PROCESSING", label: "Đang đóng gói", desc: "Sản phẩm đang được chuẩn bị" },
      { key: "SHIPPING",   label: "Đang giao",      desc: "Đơn hàng đang trên đường đến bạn" },
      { key: "DELIVERED",  label: "Đã giao",        desc: "Giao hàng thành công" },
    ];

    return (
      <main className="min-h-screen bg-background py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Trạng Thái Đơn Hàng</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cột trái: Thông báo thành công / QR Code */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Nếu là COD hoặc BANKING đã PAID */}
              {(formData.paymentMethod === "COD" || paymentStatus === "PAID") && (
                <Card className="text-center border-[#c8d5be] bg-[#f4f8f0]">
                  <CardHeader>
                    <div className="w-20 h-20 bg-[#e3ebdd] rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check className="w-10 h-10 text-[#425733]" />
                    </div>
                    <CardTitle className="text-3xl text-[#425733]">Đặt Hàng Thành Công!</CardTitle>
                    <CardDescription className="mt-4 text-base">
                      Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được tiếp nhận.
                      <br />
                      <span className="text-sm font-mono bg-white border rounded px-2 py-1 inline-block mt-3 font-bold text-[#425733]">Mã đơn: {orderNumber || orderId}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.paymentMethod === "COD" ? (
                      <p className="text-sm text-muted-foreground">Vui lòng chuẩn bị đúng số tiền khi nhận hàng. Đơn vị vận chuyển sẽ liên hệ bạn để xếp lịch giao hàng.</p>
                    ) : (
                      <p className="text-sm text-[#425733] font-medium">✅ Đã xác nhận thanh toán chuyển khoản thành công!</p>
                    )}
                    <div className="flex gap-4 justify-center pt-4">
                      <Button asChild className="bg-[#425733] hover:bg-[#364a29]">
                        <Link href="/orders">Xem Đơn Hàng Của Tôi</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/products">Tiếp Tục Mua Sắm</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Nếu là BANKING đang PENDING */}
              {formData.paymentMethod === "BANK_TRANSFER" && paymentStatus === "PENDING" && (
                <Card className="border-[#c8d5be]">
                  <CardHeader className="text-center">
                    <div className="inline-flex items-center gap-2 bg-[#425733] text-white text-sm px-4 py-1.5 rounded-full font-medium mx-auto">
                      <Clock className="w-4 h-4" />
                      Chờ thanh toán
                    </div>
                    <CardTitle className="text-2xl mt-4">Quét QR để thanh toán</CardTitle>
                    <CardDescription>Mã đơn: <span className="font-mono font-bold text-[#425733]">{orderNumber || orderId}</span></CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Countdown */}
                    <div className={`rounded-xl p-4 text-center max-w-sm mx-auto border ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-[#f4f8f0] border-[#daebd0]'}`}>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Thời gian còn lại</p>
                      <div className={`text-4xl font-mono font-bold tabular-nums my-1 ${isUrgent ? 'text-red-600' : 'text-[#425733]'}`}>
                        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                      </div>
                      <p className="text-xs text-gray-400">Trang sẽ tự động cập nhật khi thanh toán thành công</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                      <div className="relative p-3 bg-white rounded-xl border-4 border-[#425733] shadow-lg shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrUrl}
                          alt="QR chuyển khoản"
                          className="w-48 h-48 rounded-lg"
                        />
                      </div>
                      
                      <div className="flex-1 w-full max-w-sm">
                        <div className="bg-[#f0f7ea] rounded-xl p-3 text-center mb-4">
                          <p className="text-xs text-[#5a7a48] mb-0.5">Số tiền chuyển khoản</p>
                          <p className="text-2xl font-bold text-[#2d4a1e]">{transferAmount.toLocaleString("vi-VN")}đ</p>
                        </div>
                        <div className="space-y-2 text-sm bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          {[
                            { label: "Ngân hàng", value: bankName, copyKey: "bank" },
                            { label: "Số tài khoản", value: bankAccount, copyKey: "account" },
                            { label: "Chủ tài khoản", value: bankOwner, copyKey: "owner" },
                            { label: "Nội dung CK", value: transferContent, copyKey: "content" },
                          ].map(({ label, value, copyKey }) => (
                            <div key={copyKey} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                              <span className="text-gray-500 text-xs">{label}</span>
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold text-right ${copyKey === "content" ? "text-[#2d8a4e] font-mono text-base" : "text-gray-800 text-xs"}`}>{value}</span>
                                <button
                                  onClick={() => copyToClipboard(value, copyKey)}
                                  className="p-1 hover:bg-gray-100 rounded transition shrink-0"
                                  title="Copy"
                                >
                                  {copied === copyKey ? (
                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Nếu BANKING bị EXPIRED */}
              {formData.paymentMethod === "BANK_TRANSFER" && paymentStatus === "EXPIRED" && (
                <Card className="text-center border-red-200 bg-red-50">
                  <CardHeader>
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <CardTitle className="text-2xl text-red-600">Hết Thời Gian Thanh Toán</CardTitle>
                    <CardDescription>Đơn hàng đã tự động huỷ do không nhận được thanh toán trong thời gian quy định.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="mt-4">
                      <Link href="/products">Quay Lại Mua Sắm</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Order Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tiến Trình Đơn Hàng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {STATUS_STEPS.map((step, index) => (
                      <div key={step.key} className="flex gap-4 pb-4 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${(index === 0 || (index === 1 && paymentStatus === "PAID")) ? "bg-[#425733] text-white" : "bg-muted text-muted-foreground"}`}>
                            {(index === 0 || (index === 1 && paymentStatus === "PAID")) ? <Check className="w-4 h-4" /> : index + 1}
                          </div>
                          {index < STATUS_STEPS.length - 1 && <div className="w-0.5 flex-1 bg-muted mt-1" />}
                        </div>
                        <div className="pb-4">
                          <p className={`text-sm font-semibold ${(index === 0 || (index === 1 && paymentStatus === "PAID")) ? "text-[#425733]" : "text-muted-foreground"}`}>{step.label}</p>
                          <p className="text-xs text-muted-foreground">{step.desc}</p>
                          {(index === 0 || (index === 1 && paymentStatus === "PAID")) && <p className="text-xs text-[#425733] font-medium mt-0.5">✓ Hoàn thành</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cột phải: Thông tin đơn hàng & Sản phẩm */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Chi Tiết Đơn Hàng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                    {finalItems.map((item: CartItem) => (
                      <div key={item.id} className="flex gap-3">
                        <Image src={item.productImage} alt={item.productName} width={60} height={60} className="w-14 h-14 object-cover rounded bg-muted" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" title={item.productName}>{item.productName}</p>
                          {item.variants && Object.keys(item.variants).length > 0 && (
                            <p className="text-xs text-muted-foreground truncate">{Object.entries(item.variants ?? {}).map(([k, v]) => `${k}: ${v}`).join(", ")}</p>
                          )}
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                            <span className="text-sm font-semibold">{(item.price * item.quantity).toLocaleString("vi-VN")}₫</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-2 mt-4 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tạm tính</span>
                      <span>{finalSubtotal.toLocaleString("vi-VN")}₫</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Phí vận chuyển</span>
                      <span>{finalShippingFee.toLocaleString("vi-VN")}₫</span>
                    </div>
                    {finalDiscount > 0 && (
                      <div className="flex justify-between text-[#425733] font-medium">
                        <span>Giảm giá</span>
                        <span>-{finalDiscount.toLocaleString("vi-VN")}₫</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg pt-1">
                      <span>Tổng cộng</span>
                      <span className="text-[#425733]">{finalTotal.toLocaleString("vi-VN")}₫</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    );
  }
"""

if start_idx_oc != -1 and end_idx_oc != -1 and start_idx_oc < end_idx_oc:
    content = content[:start_idx_oc] + order_created_new + content[end_idx_oc:]
else:
    print(f"Could not find orderCreated block. start={start_idx_oc}, end={end_idx_oc}")

with open('apps/web/app/checkout/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done updating checkout/page.tsx")
