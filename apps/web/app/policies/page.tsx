import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PoliciesClient } from "./PoliciesClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Chính sách mua hàng | Tiệm Rêu Décor" },
  description:
    "Thông tin về bảo hành, vận chuyển, đổi trả, bảo mật và các câu hỏi thường gặp tại Tiệm Rêu Décor.",
  alternates: { canonical: "/policies" },
  openGraph: {
    title: "Chính sách mua hàng | Tiệm Rêu Décor",
    description:
      "Tìm hiểu chính sách bảo hành, vận chuyển, đổi trả và hỗ trợ khách hàng của Tiệm Rêu Décor.",
    url: "/policies",
    type: "website",
  },
};

export default async function PoliciesPage() {
  let policies: any[] = [];
  try {
    policies = await prisma.policy.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { id: true, slug: true, title: true, content: true, type: true, order: true },
    });
  } catch (error) {
    console.error("PoliciesPage: failed to load policies", error);
  }
  return <PoliciesClient policies={policies} />;
}
