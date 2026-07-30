"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleCheck,
  Copy,
  ExternalLink,
  LockKeyhole,
  TicketPercent,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  claim: null | {
    status: "PENDING" | "APPROVED" | "REJECTED" | "REDEEMED";
    reviewNote?: string | null;
    voucherCode?: string | null;
  };
};

const STORAGE_PREFIX = "community-reward-v4";
const JOINED_STORAGE_PREFIX = "community-reward-group-opened";
const EXCLUDED_PATHS = [
  "/tiem-nho-nth24",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/checkout",
  "/profile",
  "/orders",
  "/messages",
];

function StepIndicator({ joined, complete }: { joined: boolean; complete: boolean }) {
  const firstComplete = joined || complete;

  return (
    <div className="grid grid-cols-[1fr_2.5rem_1fr] items-start" aria-label="Quy trình nhận voucher">
      <div className="flex flex-col items-center text-center">
        <span className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-bold ${firstComplete ? "border-[#315a29] bg-[#315a29] text-white" : "border-[#cbd7c4] bg-white text-[#315a29]"}`}>
          {firstComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : "1"}
        </span>
        <span className="mt-2 text-xs font-semibold text-[#263824]">Vào nhóm Facebook</span>
      </div>
      <div className={`mt-4 h-px ${firstComplete ? "bg-[#6f9464]" : "bg-[#d8e0d4]"}`} />
      <div className="flex flex-col items-center text-center">
        <span className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-bold ${complete ? "border-[#315a29] bg-[#315a29] text-white" : joined ? "border-[#315a29] bg-white text-[#315a29]" : "border-[#d8e0d4] bg-white text-[#8b9787]"}`}>
          {complete ? <Check className="h-4 w-4" aria-hidden="true" /> : "2"}
        </span>
        <span className={`mt-2 text-xs font-semibold ${joined || complete ? "text-[#263824]" : "text-[#7c8878]"}`}>Nhận voucher</span>
      </div>
    </div>
  );
}

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

  const joinedStorageKey = useMemo(
    () => promo ? `${JOINED_STORAGE_PREFIX}:${promo.campaignId}:${promo.version}` : "",
    [promo]
  );
  const isExcludedPath = EXCLUDED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    setConsentReady(localStorage.getItem(ANALYTICS_CONSENT_KEY) !== null);
    const handleConsent = () => setConsentReady(true);
    window.addEventListener("analytics-consent-changed", handleConsent);
    return () => window.removeEventListener("analytics-consent-changed", handleConsent);
  }, []);

  useEffect(() => {
    if (!joinedStorageKey) return;
    setJoined(sessionStorage.getItem(joinedStorageKey) === "1");
  }, [joinedStorageKey]);

  useEffect(() => {
    if (isExcludedPath || !consentReady) return;
    if (!promo || promo.claim?.status === "PENDING" || promo.claim?.status === "REDEEMED") return;

    const key = `${STORAGE_PREFIX}:${promo.campaignId}:${promo.version}:${promo.claim?.status ?? "new"}`;
    const lastSeen = Number(localStorage.getItem(key) ?? 0);
    if (Date.now() - lastSeen < promo.repeatDays * 86400000) return;

    const timer = window.setTimeout(() => setOpen(true), promo.delaySeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [consentReady, isExcludedPath, promo]);

  const rememberDismissal = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && promo) {
      localStorage.setItem(
        `${STORAGE_PREFIX}:${promo.campaignId}:${promo.version}:${promo.claim?.status ?? "new"}`,
        String(Date.now())
      );
    }
  };

  const markGroupOpened = () => {
    setJoined(true);
    if (joinedStorageKey) sessionStorage.setItem(joinedStorageKey, "1");
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
      setPromo((current) => current ? {
        ...current,
        claim: { status: "PENDING", reviewNote: null, voucherCode: null },
      } : current);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể gửi yêu cầu");
    } finally {
      setSubmitting(false);
    }
  };

  if (!promo || isExcludedPath) return null;

  const approved = promo.claim?.status === "APPROVED";
  const pending = promo.claim?.status === "PENDING";
  const rejected = promo.claim?.status === "REJECTED";
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || "/")}`;

  return (
    <Dialog open={open} onOpenChange={rememberDismissal}>
      <DialogContent
        overlayClassName="!z-[10000] !bg-[#172016]/65 backdrop-blur-[2px]"
        className="!z-[10001] w-[calc(100%-1.5rem)] max-w-[32rem] gap-0 overflow-hidden rounded-lg border border-white/70 bg-[#fbfcf8] p-0 shadow-[0_28px_90px_rgba(20,39,16,0.34)] [&>button]:right-3 [&>button]:top-3 [&>button]:z-20 [&>button]:grid [&>button]:h-11 [&>button]:w-11 [&>button]:place-items-center [&>button]:rounded-full [&>button]:bg-black/35 [&>button]:text-white [&>button]:opacity-100 [&>button]:backdrop-blur-sm [&>button]:hover:bg-black/50 [&>button_svg]:h-5 [&>button_svg]:w-5"
      >
        <div className="relative h-36 overflow-hidden sm:h-40">
          <Image
            src="/home-hero-full-banner.png"
            alt="Terrarium thủ công của Tiệm Rêu Décor"
            fill
            sizes="(max-width: 640px) calc(100vw - 24px), 512px"
            className="object-cover object-[72%_54%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#14270f]/45 via-transparent to-[#14270f]/10" />
          <div className="absolute bottom-4 left-5 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#29491f] shadow-sm backdrop-blur-sm">
            <Users className="h-4 w-4" aria-hidden="true" />
            Cộng đồng Tiệm Rêu
          </div>
        </div>

        <div className="px-5 pb-1 pt-5 sm:px-7 sm:pt-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-[1.65rem] font-bold leading-[1.18] text-[#1f321b] [text-wrap:balance]">
              {approved ? "Voucher của bạn đã sẵn sàng" : promo.title}
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-[44ch] text-[0.9375rem] leading-6 text-[#5f6d5b]">
              {approved ? "Admin đã xác nhận bạn là thành viên của nhóm." : promo.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="mx-5 mt-4 flex items-center justify-between gap-3 border-y border-dashed border-[#b9c9b2] bg-[#eef4e9] px-3 py-3.5 sm:mx-7 sm:gap-4 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white text-[#315a29] shadow-sm sm:h-11 sm:w-11">
              <TicketPercent className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#687564] sm:text-xs">Voucher thành viên</p>
              <p className="mt-0.5 text-base font-bold text-[#263d21] sm:text-lg">Giảm trực tiếp</p>
            </div>
          </div>
          <p className="shrink-0 text-right text-xl font-extrabold tabular-nums text-[#29491f] sm:text-2xl">100.000đ</p>
        </div>

        <div className="px-5 pb-6 pt-5 sm:px-7 sm:pb-7">
          {!approved && !pending && <StepIndicator joined={joined} complete={false} />}

          <div className={`${!approved && !pending ? "mt-5" : ""} space-y-3`}>
            {approved && promo.claim?.voucherCode ? (
              <>
                <div className="flex items-start gap-3 border-l-4 border-[#4f7a45] bg-[#eef5ea] p-4 text-sm leading-6 text-[#35502f]">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  Voucher đã được gắn với tài khoản của bạn. Sao chép mã để sử dụng khi đặt hàng.
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(promo.claim?.voucherCode ?? "");
                    setCopied(true);
                  }}
                  className="flex min-h-12 w-full cursor-pointer items-center justify-between rounded-md border border-[#9eb691] bg-white px-4 text-left font-bold tracking-wide text-[#29491f] transition-colors hover:bg-[#f4f8f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a29] focus-visible:ring-offset-2"
                >
                  {promo.claim.voucherCode}
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                    {copied ? "Đã sao chép" : "Sao chép"}
                  </span>
                </button>
              </>
            ) : pending ? (
              <div className="flex items-start gap-3 border-l-4 border-[#4f7a45] bg-[#eef5ea] p-4 text-sm leading-6 text-[#35502f]" role="status">
                <CircleCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Đã gửi yêu cầu duyệt</p>
                  <p className="mt-1 text-[#5d6d58]">Admin sẽ kiểm tra thành viên và cấp voucher vào tài khoản của bạn.</p>
                </div>
              </div>
            ) : !joined ? (
              <>
                <a
                  href={promo.groupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={markGroupOpened}
                  className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-md bg-[#1877f2] px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.22)] transition-colors hover:bg-[#1269da] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2] focus-visible:ring-offset-2"
                >
                  <Image src="/brands/facebook.svg" alt="" width={20} height={20} className="h-5 w-5 brightness-0 invert" />
                  {promo.ctaLabel}
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
                <p className="flex items-center justify-center gap-1.5 text-center text-xs leading-5 text-[#657160]">
                  <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                  Không cần đăng nhập Tiệm Rêu để mở nhóm Facebook.
                </p>
              </>
            ) : sessionStatus === "loading" ? (
              <button type="button" disabled className="min-h-12 w-full rounded-md bg-[#dce5d7] px-4 text-sm font-semibold text-[#64705f]">
                Đang kiểm tra tài khoản...
              </button>
            ) : sessionStatus !== "authenticated" ? (
              <>
                <div className="border-l-4 border-[#7a966f] bg-[#f0f4ed] p-4 text-sm leading-6 text-[#42513e]">
                  <p className="font-semibold">Bạn đã có thể vào nhóm Facebook.</p>
                  <p className="mt-1 text-[#687564]">Đăng nhập Tiệm Rêu chỉ để lưu yêu cầu voucher và nhận mã sau khi admin duyệt.</p>
                </div>
                <a
                  href={loginHref}
                  className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#315a29] px-4 text-sm font-bold text-white transition-colors hover:bg-[#274a21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a29] focus-visible:ring-offset-2"
                >
                  Đăng nhập để nhận voucher
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href={promo.groupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 text-sm font-semibold text-[#315a29] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a29]"
                >
                  Mở lại nhóm Facebook
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="facebook-name" className="mb-1.5 block text-sm font-semibold text-[#34422f]">
                    Tên Facebook dùng trong nhóm <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="facebook-name"
                    value={facebookName}
                    onChange={(event) => {
                      setFacebookName(event.target.value);
                      setError("");
                    }}
                    placeholder="Ví dụ: Nguyễn An"
                    autoComplete="name"
                    maxLength={100}
                    className="min-h-11 w-full rounded-md border border-[#cbd5c7] bg-white px-3 text-base text-[#253321] outline-none transition-colors placeholder:text-[#9aa495] focus:border-[#4f7a45] focus:ring-2 focus:ring-[#4f7a45]/15"
                  />
                </div>
                <div>
                  <label htmlFor="facebook-profile" className="mb-1.5 block text-sm font-semibold text-[#34422f]">
                    Link Facebook cá nhân <span className="font-normal text-[#7a8675]">(không bắt buộc)</span>
                  </label>
                  <input
                    id="facebook-profile"
                    type="url"
                    inputMode="url"
                    value={facebookProfileUrl}
                    onChange={(event) => {
                      setFacebookProfileUrl(event.target.value);
                      setError("");
                    }}
                    placeholder="https://facebook.com/..."
                    autoComplete="url"
                    maxLength={300}
                    className="min-h-11 w-full rounded-md border border-[#cbd5c7] bg-white px-3 text-base text-[#253321] outline-none transition-colors placeholder:text-[#9aa495] focus:border-[#4f7a45] focus:ring-2 focus:ring-[#4f7a45]/15"
                  />
                </div>
                {error && <p className="text-sm font-medium text-red-700" role="alert" aria-live="polite">{error}</p>}
                <button
                  type="button"
                  disabled={submitting || facebookName.trim().length < 2}
                  onClick={submitClaim}
                  className="min-h-12 w-full cursor-pointer rounded-md bg-[#315a29] px-4 text-sm font-bold text-white transition-colors hover:bg-[#274a21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a29] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Đang gửi..." : "Gửi yêu cầu duyệt voucher"}
                </button>
              </>
            )}

            {rejected && !joined && (
              <p className="text-sm font-medium leading-6 text-red-700" role="alert">
                {promo.claim?.reviewNote || "Thông tin chưa được xác nhận. Bạn có thể mở nhóm và gửi lại yêu cầu."}
              </p>
            )}
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-[#798474]">
            Voucher được cấp sau khi admin xác nhận bạn là thành viên nhóm.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
