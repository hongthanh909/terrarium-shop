import { prisma } from "@/lib/prisma";
import { ProductDetailClient } from "./ProductDetailClient";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const customerId = (session?.user as any)?.id;

  // decode URL-encoded slug (hỗ trợ tiếng Việt trong URL)
  const slug = decodeURIComponent(params.slug);

  const product = await prisma.product.findUnique({
    where: { slug, status: "ACTIVE" },
    include: {
      category: true,
      variants: true,
      variantOptions: true,
      careGuide: true,
      _count: { select: { votes: true } }
    }
  });

  if (!product) {
    notFound();
  }

  let userVoted = false;
  if (customerId) {
    try {
      const vote = await prisma.productVote.findUnique({
        where: {
          productId_customerId: {
            productId: product.id,
            customerId
          }
        }
      });
      userVoted = !!vote;
    } catch {
      // ignore if compound key doesn't exist
    }
  }

  const relatedProducts = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, status: "ACTIVE" },
    take: 4,
    include: { category: true }
  });

  const serializedProduct = {
    ...JSON.parse(JSON.stringify(product)),
    voteCount: product._count?.votes || 0,
    userVoted
  };

  return <ProductDetailClient initialProduct={serializedProduct} initialRelated={JSON.parse(JSON.stringify(relatedProducts))} />;
}