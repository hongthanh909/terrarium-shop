import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    
    // pinnedUntil có thể là ISO string hoặc null để unpin
    const { pinnedUntil } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        pinnedUntil: pinnedUntil ? new Date(pinnedUntil) : null,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error pinning product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
