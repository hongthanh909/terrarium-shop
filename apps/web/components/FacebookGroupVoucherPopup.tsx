"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Copy, ExternalLink, TicketPercent, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FacebookGroupPromoPayload } from "@/lib/facebook-group-promo";
import { ANALYTICS_CONSENT_KEY } from "@/lib/analytics-client";

type Promo = FacebookGroupPromoPayload & {
  enabled: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  groupUrl: string;
  campaignId: string;
  delaySeconds: number;
  repeatDays: number;
  version: number;
  claim: null | { status: "PENDING" | "APPROVED" | "REJECTED" | "REDEEMED"; reviewNote?: string | null; voucherCode?: string | null };
};

const STORAGE_PREFIX = "community-reward-v3";

export function FacebookGroupVoucherPopup({ initialPromo }: { initialPromo: FacebookGroupPromoPayload }) {
  const pathname = usePathname();
  const { status: sessionStatus } = useSession();
  const [promo, setPromo] = useState<Promo | null>(initialPromo.enabled ? initialPromo as Promo : null);
  const [open, setOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const [facebookName, setFacebookName] = useState("");
  const [facebookProfileUrl, setFacebookProfileUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [consentReady, setConsentReady] = useState(false);

  useEffect(() => {
    setConsentReady(localStorage.getItem(ANALYTICS_CONSENT_KEY) !== null);
    const handleConsent = () => setConsentReady(true);
    window.addEventListener("analytics-consent-changed", handleConsent);
    return () => window.removeEventListener("analytics-consent-changed", handleConsent);
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/tiem-nho-nth24") || !consentReady) return;
    if (!promo || promo.claim?.status === "PENDING" || promo.claim?.status === "REDEEMED") return;
    const key = `${STORAGE_PREFIX}:${promo.campaignId}:${promo.version}:${promo.claim?.status ?? "new"}`;
    const lastSeen = Number(localStorage.getItem(key) ?? 0);
    if (Date.now() - lastSeen < promo.repeatDays * 86400000) return;
    const timer = window.setTimeout(() => setOpen(true), promo.delaySeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [consentReady, pathname, promo]);

  const rememberDismissal = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && promo) {
      localStorage.setItem(`${STORAGE_PREFIX}:${promo.campaignId}:${promo.version}:${promo.claim?.status ?? "new"}`, String(Date.now()));
    }
  };

  const submitClaim = async () => {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/community-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facebookName, facebookProfileUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể gửi yêu cầu");
      setPromo((current) => current ? { ...current, claim: { status: "PENDING", reviewNote: null, voucherCode: null } } : current);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể gửi yêu cầu");
    } finally {
      setSubmitting(false);
    }
  };

  if (!promo) return null;
  const approved = promo.claim?.status === "APPROVED";
  const pending = promo.claim?.status === "PENDING";

  return (
    <Dialog open={open} onOpenChange={rememberDismissal}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-md overflow-hidden rounded-lg border-0 bg-[#f7f8f3] p-0 shadow-2xl">
        <div className="bg-[#29491f] px-6 py-5 text-white">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#dbe9d3]"><Users className="h-4 w-4" /> Cộng đồng Tiệm Rêu</div>
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold leading-tight text-white">{approved ? "Voucher của bạn đã sẵn sàng" : promo.title}</DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-6 text-white/80">{approved ? "Admin đã xác nhận bạn là thành viên của nhóm." : promo.description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="relative border-y border-dashed border-[#b8c9ad] bg-white px-6 py-5 before:absolute before:-left-3 before:top-1/2 before:h-6 before:w-6 before:-translate-y-1/2 before:rounded-full before:bg-[#f7f8f3] after:absolute after:-right-3 after:top-1/2 after:h-6 after:w-6 after:-translate-y-1/2 after:rounded-full after:bg-[#f7f8f3]">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[#e8f1e2] text-[#29491f]"><TicketPercent className="h-6 w-6" /></div>
            <div><p className="text-xs font-semibold uppercase text-gray-500">Ưu đãi thành viên</p><p className="text-2xl font-bold text-[#22351c]">GIẢM 100.000Đ</p></div>
          </div>
        </div>

        <div className="space-y-3 px-6 py-5">
          {approved && promo.claim?.voucherCode ? (
            <button onClick={async () => { await navigator.clipboard.writeText(promo.claim?.voucherCode ?? ""); setCopied(true); }} className="flex min-h-12 w-full items-center justify-between rounded-md border border-[#9eb691] bg-white px-4 text-left font-bold tracking-wide text-[#29491f]">
              {promo.claim.voucherCode}<span className="flex items-center gap-1 text-xs font-medium">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Đã sao chép" : "Sao chép"}</span>
            </button>
          ) : pending ? (
            <div className="rounded-md bg-[#edf3e9] p-4 text-sm leading-6 text-[#35502b]">Yêu cầu đã được gửi. Admin sẽ kiểm tra thành viên và duyệt voucher cho tài khoản của bạn.</div>
          ) : !joined ? (
            <a href={promo.groupUrl} target="_blank" rel="noopener noreferrer" onClick={() => setJoined(true)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#29491f] px-4 text-sm font-semibold text-white hover:bg-[#365c2a]">{promo.ctaLabel}<ExternalLink className="h-4 w-4" /></a>
          ) : sessionStatus !== "authenticated" ? (
            <a href={`/login?callbackUrl=${encodeURIComponent(pathname)}`} className="flex min-h-12 w-full items-center justify-center rounded-md bg-[#29491f] px-4 text-sm font-semibold text-white">Đăng nhập để gửi yêu cầu</a>
          ) : (
            <>
              <input value={facebookName} onChange={(event) => setFacebookName(event.target.value)} placeholder="Tên Facebook của bạn" maxLength={100} className="min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#5b7b4d]" />
              <input value={facebookProfileUrl} onChange={(event) => setFacebookProfileUrl(event.target.value)} placeholder="Link Facebook cá nhân (không bắt buộc)" maxLength={300} className="min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#5b7b4d]" />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button disabled={submitting || facebookName.trim().length < 2} onClick={submitClaim} className="min-h-12 w-full rounded-md bg-[#29491f] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Đang gửi..." : "Gửi yêu cầu duyệt voucher"}</button>
            </>
          )}
          {promo.claim?.status === "REJECTED" && !joined && <p className="text-sm text-red-600">{promo.claim.reviewNote || "Thông tin chưa được xác nhận. Bạn có thể tham gia nhóm và gửi lại."}</p>}
          <p className="text-center text-xs leading-5 text-gray-500">Voucher chỉ được cấp sau khi admin xác nhận thành viên.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
