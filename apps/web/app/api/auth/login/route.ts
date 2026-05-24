/**
 * Custom login route cho Customer (front-end /login page).
 *
 * Lưu ý: Auth session được quản lý hoàn toàn bởi NextAuth.
 * Route này chỉ validate credentials, sau đó client tự gọi
 * signIn("customer-login") từ next-auth/react để tạo session.
 *
 * Route này hữu ích cho:
 * - Pre-validation (kiểm tra email/pass trước khi gọi NextAuth)
 * - Tích hợp với các client không dùng next-auth/react
 */
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;

    const customer = await prisma.customer.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!customer || !customer.passwordHash) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, customer.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    // Trả về thông tin user (không trả passwordHash)
    // Client cần gọi signIn("customer-login") sau đó để tạo NextAuth session
    return NextResponse.json({
      success: true,
      user: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        role: customer.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}
