import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(100).optional(),
  phone: z.string().regex(/^[0-9+\s-]{9,15}$/, "Số điện thoại không hợp lệ").optional().nullable(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
});

// GET /api/profile — lấy thông tin profile
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: token.id as string },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// PUT /api/profile — cập nhật thông tin profile
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // ─── Đổi mật khẩu ────────────────────────────────────────────────────────
    if (action === "change-password") {
      const validated = changePasswordSchema.parse(body);

      const customer = await prisma.customer.findUnique({
        where: { id: token.id as string },
        select: { passwordHash: true },
      });

      if (!customer?.passwordHash) {
        return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });
      }

      const isValid = await bcrypt.compare(validated.currentPassword, customer.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 400 });
      }

      const newHash = await bcrypt.hash(validated.newPassword, 10);
      await prisma.customer.update({
        where: { id: token.id as string },
        data: { passwordHash: newHash },
      });

      return NextResponse.json({ success: true, message: "Đổi mật khẩu thành công" });
    }

    // ─── Cập nhật thông tin cơ bản ───────────────────────────────────────────
    const validated = updateProfileSchema.parse(body);
    const updated = await prisma.customer.update({
      where: { id: token.id as string },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.phone !== undefined && { phone: validated.phone }),
      },
      select: { id: true, name: true, email: true, phone: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: error.errors }, { status: 400 });
    }
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
