"use client";

import { useState } from "react";

function compactMoney(value: string) {
  const number = Number(value.replace(/[^\d]/g, ""));
  if (!number) return "";
  return number.toLocaleString("vi-VN");
}

export default function InquiryForm({ productId, shopPhone }: { productId: string; shopPhone?: string | null }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, FormDataEntryValue>;
    if (payload.offerPrice) payload.offerPrice = String(payload.offerPrice).replace(/[^\d]/g, "");
    if (!payload.offerPrice) delete payload.offerPrice;
    if (!payload.message && payload.offerPrice) payload.message = `Toi muon tra gia ${Number(payload.offerPrice).toLocaleString("vi-VN")} d.`;
    if (!payload.message && !payload.offerPrice) {
      setLoading(false);
      setMessage("Vui long nhap tin nhan hoac gia muon tra.");
      return;
    }

    const response = await fetch(`/api/marketplace/product-inquiries/${productId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setLoading(false);
    setMessage(response.ok ? "Da gui tin cho shop. Admin co the kiem soat lich su lien he nay." : data.error || "Gui lien he that bai.");
    if (response.ok) {
      event.currentTarget.reset();
      setOfferPrice("");
    }
  }

  return (
    <form id="shop-chat" onSubmit={onSubmit} className="grid gap-4 border-t border-[#e7ece2] pt-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={shopPhone ? `tel:${shopPhone}` : undefined}
          className="rounded-xl bg-[#f3f4f2] px-4 py-3 text-center text-sm font-bold text-[#111611] aria-disabled:pointer-events-none aria-disabled:opacity-60"
          aria-disabled={!shopPhone}
        >
          {shopPhone ? `Hien so ${shopPhone.slice(0, 6)}****` : "Shop chua co SDT"}
        </a>
        <button type="button" className="min-h-11 rounded-control bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover">
          Chat
        </button>
      </div>

      <div className="rounded-xl bg-[#f4f4f3] p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            name="message"
            placeholder="Dang nhap de gui tin nhan"
            className="min-h-12 rounded-xl border border-transparent bg-transparent px-1 text-sm outline-none placeholder:text-[#8a8f86] focus:border-[#cfd8c8] focus:bg-white focus:px-3"
          />
          <button disabled={loading} className="min-h-11 rounded-control bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-60">
            {loading ? "Dang gui" : "Gui"}
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        <h2 className="text-sm font-bold text-[#111611]">Deal gia</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <input
              name="offerPrice"
              inputMode="numeric"
              value={offerPrice}
              onChange={(event) => setOfferPrice(compactMoney(event.target.value))}
              placeholder="Nhap gia ban mong muon"
              className="h-12 w-full rounded-xl border border-[#d1d6cc] bg-white px-4 pr-10 text-sm outline-none focus:border-[#7b966b] focus:ring-2 focus:ring-[#e6f0df]"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#6f756a]">d</span>
          </div>
          <button disabled={loading} className="min-h-11 rounded-control border border-border bg-secondary px-6 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-60">
            Tra gia
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <input name="name" required placeholder="Ten cua ban" className="rounded-xl border border-[#d6e2ce] px-3 py-2 text-sm" />
        <input name="phone" placeholder="So dien thoai" className="rounded-xl border border-[#d6e2ce] px-3 py-2 text-sm" />
        <input name="email" type="email" placeholder="Email" className="rounded-xl border border-[#d6e2ce] px-3 py-2 text-sm" />
      </div>
      {message && <p className="text-sm font-medium text-primary">{message}</p>}
    </form>
  );
}
