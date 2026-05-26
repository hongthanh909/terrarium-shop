import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/profile/favorites — lấy danh sách sản phẩm user đã vote (yêu thích)
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const votes = await prisma.productVote.findMany({
      where: { customerId: token.id as string },
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
      orderBy: { createdAt: "desc" },
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
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
