"use client";

import { motion } from "framer-motion";
import { Shield, MessageCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

interface Policy {
  id: string;
  title: string;
  content: string;
  type: string;
  order: number;
}

const typeLabels: Record<string, { label: string; icon: string }> = {
  warranty: { label: "Bảo hành", icon: "🛡️" },
  shipping: { label: "Vận chuyển", icon: "🚚" },
  returns: { label: "Đổi trả", icon: "↩️" },
  privacy: { label: "Bảo mật", icon: "🔒" },
  faq: { label: "Câu hỏi thường gặp", icon: "❓" },
  policy: { label: "Chính sách khác", icon: "📋" },
};

function AccordionItem({ policy, index }: { policy: Policy; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="border border-[#d4e4c9] rounded-2xl mb-3 overflow-hidden bg-white"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#f5f8f3] transition-colors group"
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
          className="px-6 pb-5 pt-1 text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none border-t border-[#e8f0e3]"
          dangerouslySetInnerHTML={{ __html: policy.content.replace(/\n/g, "<br/>") }}
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
  const grouped = policies.reduce<Record<string, Policy[]>>((acc, p) => {
    if (!acc[p.type]) acc[p.type] = [];
    acc[p.type].push(p);
    return acc;
  }, {});

  return (
    <motion.main
      className="min-h-screen bg-[#fafbf8] py-12 px-6"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="max-w-4xl mx-auto">

        {/* Hero Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-[#425733] to-[#6d8c5a] flex items-center justify-center mx-auto mb-5 shadow-[0_8px_24px_rgba(66,87,51,0.3)] p-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div className="inline-flex items-center gap-2 bg-[#e3ebdd] px-4 py-2 rounded-full text-sm font-medium text-[#425733] mb-3">
            <span>Minh bạch & Tin cậy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a2e12] mb-4">
            Chính sách & Hướng dẫn
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Tìm hiểu về các chính sách, điều khoản và thông tin hữu ích khi mua sắm tại Tiệm Rêu decor
          </p>
        </motion.div>

        {/* Policy Sections */}
        {policies.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-gray-400">Chưa có chính sách nào.</p>
          </motion.div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([type, typePolicies], groupIndex) => {
              const meta = typeLabels[type] || { label: type, icon: "📄" };
              return (
                <motion.section
                  key={type}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: groupIndex * 0.08 }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-2xl">{meta.icon}</span>
                    <h2 className="text-xl font-bold text-[#1a2e12]">{meta.label}</h2>
                    <div className="flex-1 h-px bg-[#d4e4c9] ml-1" />
                  </div>
                  <div>
                    {[...typePolicies]
                      .sort((a, b) => a.order - b.order)
                      .map((policy, i) => (
                        <AccordionItem key={policy.id} policy={policy} index={i} />
                      ))}
                  </div>
                </motion.section>
              );
            })}
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
