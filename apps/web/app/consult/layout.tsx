import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Tư vấn terrarium | Tiệm Rêu Décor" },
  description:
    "Hỏi trợ lý Tiệm Rêu về chăm sóc terrarium, lựa chọn sản phẩm và các vấn đề thường gặp.",
  alternates: { canonical: "/consult" },
};

export default function ConsultLayout({ children }: { children: React.ReactNode }) {
  return children;
}
