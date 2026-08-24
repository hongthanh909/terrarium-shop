import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Liên hệ Tiệm Rêu Décor" },
  description:
    "Liên hệ Tiệm Rêu Décor để được tư vấn terrarium, chăm sóc cây, đơn hàng và giao nhận.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
