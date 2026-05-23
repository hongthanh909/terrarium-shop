"use client";

import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Leaf } from "lucide-react";

interface Policy {
  id: string;
  slug: string;
  title: string;
  content: string;
  type: string;
  order: number;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/policies")
      .then((res) => res.json())
      .then((data) => {
        setPolicies(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Group policies by type for better organization
  const groupedPolicies = policies.reduce((acc, policy) => {
    if (!acc[policy.type]) acc[policy.type] = [];
    acc[policy.type].push(policy);
    return acc;
  }, {} as Record<string, Policy[]>);

  const typeLabels: Record<string, string> = {
    warranty: "Bảo hành",
    shipping: "Vận chuyển",
    returns: "Đổi trả",
    privacy: "Bảo mật",
    faq: "Câu hỏi thường gặp",
    policy: "Chính sách khác",
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[hsl(0,0%,100%)] py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#e3ebdd] rounded w-1/3" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-[#e3ebdd] rounded" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[hsl(0,0%,100%)] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-[#425733] flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-[#ffffff]" />
          </div>
          <h1 className="text-4xl font-bold text-[hsl(220,14%,25%)] mb-4">Chính sách & Hướng dẫn</h1>
          <p className="text-[hsl(220,14%,45%)] max-w-2xl mx-auto">
            Tìm hiểu về các chính sách, điều khoản và thông tin hữu ích khi mua sắm tại Tiệm Rêu decor
          </p>
        </div>

        {policies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[hsl(220,14%,45%)]">Chưa có chính sách nào.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedPolicies).map(([type, typePolicies]) => (
              <section key={type}>
                <h2 className="text-2xl font-bold text-[hsl(220,14%,25%)] mb-4 border-b border-[#c8d5be] pb-2">
                  {typeLabels[type] || type}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {typePolicies
                    .sort((a, b) => a.order - b.order)
                    .map((policy) => (
                      <AccordionItem key={policy.id} value={policy.id} className="border-[#e3ebdd] rounded-xl mb-3 px-6">
                        <AccordionTrigger className="text-left hover:no-underline py-4">
                          <span className="font-semibold text-[hsl(220,14%,25%)]">{policy.title}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-[hsl(220,14%,45%)] pb-4">
                          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: policy.content.replace(/\n/g, '<br/>') }} />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              </section>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 p-6 bg-[#e3ebdd] rounded-2xl text-center">
          <h3 className="font-bold mb-2 text-[hsl(220,14%,25%)]">Cần hỗ trợ thêm?</h3>
          <p className="text-sm text-[hsl(220,14%,45%)] mb-4">
            Nếu bạn không tìm thấy thông tin cần, hãy liên hệ với chúng tôi.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#425733] text-white rounded-full font-semibold hover:bg-[#364a29] transition-colors"
          >
            Liên hệ ngay
          </a>
        </div>
      </div>
    </main>
  );
}
