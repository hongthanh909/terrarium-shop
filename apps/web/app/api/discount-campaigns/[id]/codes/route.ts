import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_BATCH_SIZE = 500;

function generateCode(prefix: string, randomLength: number) {
  const bytes = randomBytes(randomLength);
  let suffix = "";

  for (const byte of bytes) {
    suffix += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }

  return `${prefix}${suffix}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  try {
    const { id } = await params;
    const campaign = await prisma.discountCampaign.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Discount campaign not found" }, { status: 404 });
    }

    const codes = await prisma.discountCode.findMany({
      where: { campaignId: id },
      select: {
        id: true,
        code: true,
        status: true,
        usageLimit: true,
        usageCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(codes);
  } catch (error) {
    console.error("Error fetching discount codes:", error);
    return NextResponse.json({ error: "Không thể tải danh sách mã riêng" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const quantity = Number(body.quantity ?? 10);
    const randomLength = Number(body.length ?? 8);
    const usageLimit = body.usageLimit === "" || body.usageLimit == null
      ? 1
      : Number(body.usageLimit);
    const prefix = String(body.prefix ?? "")
      .trim()
      .toUpperCase();

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Số lượng mã phải từ 1 đến ${MAX_BATCH_SIZE}` },
        { status: 400 }
      );
    }

    if (!Number.isInteger(randomLength) || randomLength < 4 || randomLength > 24) {
      return NextResponse.json(
        { error: "Độ dài phần ngẫu nhiên phải từ 4 đến 24 ký tự" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(usageLimit) || usageLimit < 1 || usageLimit > 1000) {
      return NextResponse.json(
        { error: "Giới hạn lượt dùng phải từ 1 đến 1.000" },
        { status: 400 }
      );
    }

    if (!/^[A-Z0-9_-]{0,12}$/.test(prefix)) {
      return NextResponse.json(
        { error: "Tiền tố chỉ được chứa chữ in hoa, số, dấu gạch ngang hoặc gạch dưới" },
        { status: 400 }
      );
    }

    if (prefix.length + randomLength > 32) {
      return NextResponse.json(
        { error: "Tổng độ dài mã không được vượt quá 32 ký tự" },
        { status: 400 }
      );
    }

    const campaign = await prisma.discountCampaign.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, code: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Discount campaign not found" }, { status: 404 });
    }

    let availableCodes: string[] = [];

    for (let attempt = 0; attempt < 5 && availableCodes.length < quantity; attempt += 1) {
      const candidates = new Set<string>();
      while (candidates.size < quantity * 2) {
        candidates.add(generateCode(prefix, randomLength));
      }

      const candidateList = Array.from(candidates);
      const [existingCodes, existingCampaignCodes] = await Promise.all([
        prisma.discountCode.findMany({
          where: { code: { in: candidateList } },
          select: { code: true },
        }),
        prisma.discountCampaign.findMany({
          where: { code: { in: candidateList } },
          select: { code: true },
        }),
      ]);
      const taken = new Set([
        ...existingCodes.map((item) => item.code),
        ...existingCampaignCodes.map((item) => item.code),
      ]);

      availableCodes = candidateList.filter((code) => !taken.has(code)).slice(0, quantity);
    }

    if (availableCodes.length < quantity) {
      return NextResponse.json(
        { error: "Không thể tạo đủ mã duy nhất, hãy thử lại" },
        { status: 409 }
      );
    }

    await prisma.discountCode.createMany({
      data: availableCodes.map((code) => ({
        campaignId: id,
        code,
        usageLimit,
      })),
      skipDuplicates: true,
    });

    const codes = await prisma.discountCode.findMany({
      where: { campaignId: id, code: { in: availableCodes } },
      select: {
        id: true,
        code: true,
        status: true,
        usageLimit: true,
        usageCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    await logAdminAction(admin.id, "CREATE", "DiscountCode", id, {
      campaignCode: campaign.code,
      quantity: codes.length,
      prefix,
      randomLength,
      usageLimit,
    });

    return NextResponse.json({ success: true, codes }, { status: 201 });
  } catch (error) {
    console.error("Error generating discount codes:", error);
    return NextResponse.json({ error: "Không thể tạo mã riêng" }, { status: 500 });
  }
}
