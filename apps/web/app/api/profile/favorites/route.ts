import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/profile/favorites — lấy danh sách sản phẩm user đã vote (yêu thích)
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id && !token?.sub) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const customerId = (token.id || token.sub) as string;

    const votes = await prisma.productVote.findMany({
      where: { customerId },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            basePrice: true,
            images: true,
            status: true,
            category: {
              select: { name: true },
            },
            _count: {
              select: { votes: true },
            },
          },
        },
      },
      orderBy: { votedAt: "desc" },
    });

    // Chỉ trả về sản phẩm còn ACTIVE
    const products = votes
      .map((v) => v.product)
      .filter((p) => p.status === "ACTIVE")
      .map((p) => ({
        ...p,
        basePrice: Number(p.basePrice),
      }));

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("[Favorites API] Error:", error?.message);
    console.error("[Favorites API] Detail:", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: "Lỗi server", detail: error?.message }, { status: 500 });
  }
}
