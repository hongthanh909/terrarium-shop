import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

// Server component để generate metadata cho product detail
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: (await params).slug },
      select: {
        name: true,
        images: true,
        category: { select: { name: true } },
      },
    });

    if (!product) {
      return {
        title: "Sản phẩm không tồn tại | Tiệm Rêu Décor",
        description: "Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa.",
      };
    }

    const title = `${product.name} | Tiệm Rêu Décor`;
    const description = `Mua ${product.name} chính hãng tại Tiệm Rêu Décor. ${
      product.category ? `Danh mục: ${product.category.name}.` : ""
    } Terrarium & Moss Art thủ công, giao hàng toàn quốc.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: product.images[0]
          ? [{ url: product.images[0], width: 800, height: 800, alt: product.name }]
          : [],
        type: "website",
        locale: "vi_VN",
        siteName: "Tiệm Rêu Décor",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: product.images[0] ? [product.images[0]] : [],
      },
    };
  } catch {
    return {
      title: "Sản phẩm | Tiệm Rêu Décor",
      description: "Khám phá các sản phẩm terrarium tại Tiệm Rêu Décor.",
    };
  }
}

export default function ProductSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
