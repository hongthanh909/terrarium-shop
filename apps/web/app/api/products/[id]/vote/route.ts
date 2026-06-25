import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.id) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để bình chọn" }, { status: 401 });
    }

    const customerId = token.id as string;
    const productId = (await params).id;

    // Check if vote exists
    const existingVote = await prisma.productVote.findUnique({
      where: {
        productId_customerId: {
          productId,
          customerId,
        },
      },
    });

    if (existingVote) {
      // If exists, remove it (toggle off)
      await prisma.productVote.delete({
        where: {
          productId_customerId: {
            productId,
            customerId,
          },
        },
      });
      return NextResponse.json({ message: "Đã bỏ bình chọn", voted: false });
    } else {
      // If not exists, create it (toggle on)
      await prisma.productVote.create({
        data: {
          productId,
          customerId,
        },
      });
      return NextResponse.json({ message: "Đã bình chọn", voted: true });
    }
  } catch (error) {
    console.error("Error toggling vote:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi bình chọn" },
      { status: 500 }
    );
  }
}
