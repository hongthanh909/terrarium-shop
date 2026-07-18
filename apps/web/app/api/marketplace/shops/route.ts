import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const province = searchParams.get("province") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(48, Math.max(1, Number(searchParams.get("limit") || 12)));

  const where: any = { status: "ACTIVE" };
  if (province) where.province = province;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        province: true,
        district: true,
        ratingPercent: true,
        ratingCount: true,
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.shop.count({ where }),
  ]);

  return NextResponse.json({
    shops,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
