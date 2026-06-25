import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const comment = await prisma.blogComment.findUnique({
      where: { id: (await params).id },
      select: { customerId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Bình luận không tồn tại" }, { status: 404 });
    }

    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
