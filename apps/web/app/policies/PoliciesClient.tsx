"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  CircleHelp,
  FileText,
  LockKeyhole,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize-html";

interface Policy {
  id: string;
  slug: string;
  title: string;
  content: string;
  type: string;
  order: number;
}

const TYPE_ORDER = ["warranty", "shipping", "returns", "privacy", "faq", "policy"];

const policyIcons = {
  warranty: ShieldCheck,
  shipping: Truck,
  returns: RotateCcw,
  privacy: LockKeyhole,
  faq: CircleHelp,
  policy: FileText,
};

function AccordionItem({ policy, index }: { policy: Policy; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const Icon = policyIcons[policy.type as keyof typeof policyIcons] || FileText;
  const contentId = `policy-content-${policy.id}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.035, 0.18) }}
      className="border-t border-border first:border-t-0"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
        className="group flex min-h-20 w-full items-center gap-4 px-4 py-5 text-left transition-colors hover:bg-muted/70 sm:px-6"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-white text-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 text-base font-semibold text-foreground sm:text-lg">
          {policy.title}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>

      <motion.div
        id={contentId}
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-7 sm:pl-20 sm:pr-6">
          <div
            className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-a:text-foreground prose-strong:text-foreground"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(policy.content.replace(/\n/g, "<br/>")),
            }}
          />
          <Link
            href={`/policies/${policy.slug}`}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-foreground transition-colors hover:border-foreground/30 hover:bg-muted"
          >
            Mở trang chính sách
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    </motion.article>
  );
}

export function PoliciesClient({ policies }: { policies: Policy[] }) {
  const prefersReducedMotion = useReducedMotion();
  const sortedPolicies = [...policies].sort((a, b) => {
    const typeA = TYPE_ORDER.indexOf(a.type);
    const typeB = TYPE_ORDER.indexOf(b.type);
    const orderA = typeA === -1 ? 999 : typeA;
    const orderB = typeB === -1 ? 999 : typeB;

    if (orderA !== orderB) return orderA - orderB;
    return a.order - b.order;
  });

  return (
    <motion.div
      className="min-h-[100dvh] bg-white px-4 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-14"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 grid gap-6 border-b border-border pb-9 md:grid-cols-[1fr_0.7fr] md:items-end sm:mb-12 sm:pb-11">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
              Thông tin mua hàng
            </p>
            <h1 className="max-w-2xl font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              Chính sách rõ ràng cho từng đơn hàng
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground md:justify-self-end sm:text-base">
            Tra cứu thông tin bảo hành, vận chuyển, đổi trả và quyền riêng tư trước hoặc sau khi mua sắm tại Tiệm Rêu.
          </p>
        </header>

        {sortedPolicies.length === 0 ? (
          <div className="rounded-lg border border-border bg-[#f7f8f6] px-6 py-20 text-center">
            <FileText className="mx-auto mb-5 h-10 w-10 text-muted-foreground" />
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              Nội dung đang được cập nhật
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Các chính sách sẽ sớm được hiển thị. Trong thời gian này, bạn có thể liên hệ trực tiếp với Tiệm Rêu để được hỗ trợ.
            </p>
          </div>
        ) : (
          <section aria-label="Danh sách chính sách" className="overflow-hidden rounded-lg border border-border bg-white">
            {sortedPolicies.map((policy, index) => (
              <AccordionItem key={policy.id} policy={policy} index={index} />
            ))}
          </section>
        )}

        <section className="mt-12 grid overflow-hidden rounded-lg border border-border bg-[#f7f8f6] sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-foreground">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-foreground">Cần hỗ trợ thêm?</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Đội ngũ Tiệm Rêu sẽ giải đáp các trường hợp chưa được đề cập trong chính sách.
            </p>
          </div>
          <div className="border-t border-border p-6 sm:border-l sm:border-t-0 sm:p-8">
            <Link
              href="/contact"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-foreground px-5 text-sm font-semibold text-white transition-colors hover:bg-foreground/85 sm:w-auto"
            >
              Liên hệ Tiệm Rêu
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
