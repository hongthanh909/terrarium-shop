"use client";

import { motion } from "framer-motion";
import { MessageCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { sanitizeHtml } from "@/lib/sanitize-html";

interface Policy {
  id: string;
  title: string;
  content: string;
  type: string;
  order: number;
}

const TYPE_ORDER = ["warranty", "shipping", "returns", "privacy", "faq", "policy"];

function AccordionItem({ policy, index }: { policy: Policy; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="border-b border-[#e3ebdd] last:border-b-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[#f5f8f3] transition-colors group"
      >
        <span className="font-semibold text-[#1a2e12] group-hover:text-[#425733] transition-colors pr-4">
          {policy.title}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-[#425733]" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div
          className="px-6 pb-6 pt-1 text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.content.replace(/\n/g, "<br/>")) }}
        />
      </motion.div>
    </motion.div>
  );
}

export function PoliciesClient({
  policies,
}: {
  policies: Policy[];
}) {
  // Sort all policies: first by type order, then by order within type
  const sortedPolicies = [...policies].sort((a, b) => {
    const typeA = TYPE_ORDER.indexOf(a.type);
    const typeB = TYPE_ORDER.indexOf(b.type);
    const orderA = typeA === -1 ? 999 : typeA;
    const orderB = typeB === -1 ? 999 : typeB;
    if (orderA !== orderB) return orderA - orderB;
    return a.order - b.order;
  });

  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.main
      className="min-h-[100dvh] bg-[#fafbf8] py-12 px-6"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="max-w-3xl mx-auto">

        {/* Hero Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-[#e3ebdd] px-4 py-2 rounded-full text-sm font-medium text-[#425733] mb-4">
            <span>Minh bạch &amp; Tin cậy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a2e12] mb-4">
            Chính sách &amp; Hướng dẫn
            <br />
            <span className="text-2xl md:text-3xl font-medium text-[#6d8c5a]">của Rêu</span>
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Tìm hiểu về các chính sách, điều khoản và thông tin hữu ích khi mua sắm tại Tiệm Rêu décor
          </p>
        </motion.div>

        {/* All policies — single flat accordion */}
        {policies.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-gray-400">Chưa có chính sách nào.</p>
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e3ebdd] shadow-sm overflow-hidden">
            {sortedPolicies.map((policy, i) => (
              <AccordionItem key={policy.id} policy={policy} index={i} />
            ))}
          </div>
        )}

        {/* CTA */}
        <motion.div
          className="mt-14 p-8 bg-gradient-to-br from-[#e3ebdd] to-[#d4e4c9] rounded-3xl text-center border border-[#c8d5be]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#425733] flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold mb-2 text-[#1a2e12] text-lg">Cần hỗ trợ thêm?</h3>
          <p className="text-sm text-gray-500 mb-5">
            Nếu bạn không tìm thấy thông tin cần thiết, đội ngũ chúng tôi luôn sẵn sàng hỗ trợ.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#425733] text-white rounded-full font-semibold hover:bg-[#364a29] hover:shadow-[0_8px_24px_rgba(66,87,51,0.35)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4" />
            Liên hệ ngay
          </a>
        </motion.div>
      </div>
    </motion.main>
  );
}
