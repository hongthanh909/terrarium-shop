import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Leaf } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // Cache for 1 hour

export default async function PoliciesPage() {
  const policies = await prisma.policy.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  // Group policies by type for better organization
  const groupedPolicies = policies.reduce<Record<string, typeof policies>>((acc, policy) => {
    if (!acc[policy.type]) acc[policy.type] = [];
    acc[policy.type].push(policy);
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    warranty: "Bảo hành",
    shipping: "Vận chuyển",
    returns: "Đổi trả",
    privacy: "Bảo mật",
    faq: "Câu hỏi thường gặp",
    policy: "Chính sách khác",
  };

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
