"use client";

import { useState } from "react";
import { VIETNAM_PROVINCES_2025 } from "@/lib/vietnam-locations";

export default function RegisterShopForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const response = await fetch("/api/shop/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        commitmentAccepted: form.get("commitmentAccepted") === "on",
      }),
    });
    const data = await response.json();
    setLoading(false);
    setMessage(response.ok ? "Đã gửi đơn đăng ký shop. Vui lòng chờ admin duyệt." : data.error || "Gửi đơn thất bại.");
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-[#dfe8d7] bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          Tên shop
          <input name="shopName" required className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          Slug shop
          <input name="shopSlug" required placeholder="shop-terrarium" className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          Tên chủ shop
          <input name="ownerName" required className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          CCCD/CMND
          <input name="ownerIdNumber" required inputMode="numeric" placeholder="9-12 chữ số" className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          Zalo URL
          <input name="zaloUrl" type="url" className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          Tỉnh/thành
          <select name="province" className="rounded-xl border border-[#d6e2ce] bg-white px-3 py-2">
            <option value="">Chọn tỉnh/thành</option>
            {VIETNAM_PROVINCES_2025.map((province) => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
          Quận/huyện hoặc khu vực
          <input name="district" className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
        Địa chỉ
        <input name="address" className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[#3c4d35]">
        Mô tả shop
        <textarea name="description" rows={4} className="rounded-xl border border-[#d6e2ce] px-3 py-2" />
      </label>
      <div className="rounded-xl border border-[#d6e2ce] bg-[#f7faf4] p-4 text-sm leading-6 text-[#526248]">
        Email và số điện thoại sẽ lấy từ tài khoản đã đăng nhập. Vui lòng cập nhật họ tên và số điện thoại trong hồ sơ trước khi gửi đơn mở shop.
      </div>
      <label className="flex items-start gap-3 text-sm text-[#526248]">
        <input name="commitmentAccepted" type="checkbox" required className="mt-1" />
        <span>Tôi cam kết chỉ đăng sản phẩm liên quan terrarium/phụ kiện và tự chịu trách nhiệm giao dịch với người mua.</span>
      </label>
      <button disabled={loading} className="min-h-11 w-fit rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60">
        {loading ? "Đang gửi..." : "Gửi đơn đăng ký"}
      </button>
      {message && <p className="text-sm font-medium text-primary">{message}</p>}
    </form>
  );
}
