import { prisma } from "@/lib/prisma";
import { ProductDetailClient } from "./ProductDetailClient";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sanitizeProductImages } from "@/lib/product-images";
import type { Metadata } from "next";
import { cache } from "react";

// ISR: cache sản phẩm 60 giây
export const dynamic = "force-dynamic";

const getProduct = cache((slug: string) => prisma.product.findUnique({
  where: { slug, status: "ACTIVE" },
  include: {
    category: true,
    variants: true,
    variantOptions: true,
    careGuide: true,
    _count: { select: { votes: true } },
  },
}));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = decodeURIComponent((await params).slug);
  const product = await getProduct(slug);
  if (!product) return { title: "Không tìm thấy sản phẩm" };

  const images = sanitizeProductImages(product.images);
  const description = `${product.name} thuộc bộ sưu tập ${product.category.name}, được làm thủ công tại Tiệm Rêu Décor.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images: images[0] ? [{ url: images[0], alt: product.name }] : undefined,
    },
  };
}

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
    getProduct(slug),
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
      include: {
        category: true,
        reviews: { where: { approved: true }, select: { rating: true } },
        _count: { select: { reviews: true } },
      }
    }),
  ]);

  const serializedProduct = {
    ...JSON.parse(JSON.stringify(product)),
    images: sanitizeProductImages(product.images),
    voteCount: product._count?.votes || 0,
    userVoted: !!voteResult,
  };

  const serializedRelated = relatedProducts.map((relatedProduct) => ({
    ...JSON.parse(JSON.stringify(relatedProduct)),
    images: sanitizeProductImages(relatedProduct.images),
  }));

  return <ProductDetailClient initialProduct={serializedProduct} initialRelated={serializedRelated} />;
}
