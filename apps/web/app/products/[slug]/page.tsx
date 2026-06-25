import { prisma } from "@/lib/prisma";
import { ProductDetailClient } from "./ProductDetailClient";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ISR: cache sản phẩm 60 giây
export const dynamic = "force-dynamic";

// ✅ Prerender tất cả sản phẩm ACTIVE tại build time — xóa hoàn toàn cold start
export async function generateStaticParams() {
  return [];
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  // decode URL-encoded slug (hỗ trợ tiếng Việt trong URL)
  const slug = decodeURIComponent((await params).slug);

  // ✅ Parallel: session + product cùng lúc thay vì tuần tự
  const [session, product] = await Promise.all([
    getServerSession(authOptions),
    prisma.product.findUnique({
      where: { slug, status: "ACTIVE" },
      include: {
        category: true,
        variants: true,
        variantOptions: true,
        careGuide: true,
        _count: { select: { votes: true } }
      }
    }),
  ]);

  if (!product) {
    notFound();
  }

  const customerId = (session?.user as any)?.id;

  // ✅ Parallel: vote check + related products cùng lúc
  const [voteResult, relatedProducts] = await Promise.all([
    customerId
      ? prisma.productVote.findUnique({
          where: { productId_customerId: { productId: product.id, customerId } }
        }).catch(() => null)
      : Promise.resolve(null),
    prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, status: "ACTIVE" },
      take: 4,
      include: { category: true }
    }),
  ]);

  const serializedProduct = {
    ...JSON.parse(JSON.stringify(product)),
    voteCount: product._count?.votes || 0,
    userVoted: !!voteResult,
  };

  return <ProductDetailClient initialProduct={serializedProduct} initialRelated={JSON.parse(JSON.stringify(relatedProducts))} />;
}