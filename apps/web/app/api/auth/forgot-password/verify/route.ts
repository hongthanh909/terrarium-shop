import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";

const verifyForgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  code: z.string().regex(/^\d{6}$/, "Mã xác minh phải gồm 6 số"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = verifyForgotPasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const email = validated.data.email.trim().toLowerCase();
    const { code } = validated.data;

    const user = await prisma.customer.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        resetToken: true,
        resetTokenExpiry: true,
      },
    });

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return NextResponse.json(
        { error: "Không tìm thấy yêu cầu đặt lại mật khẩu. Vui lòng yêu cầu mã mới." },
        { status: 404 }
      );
    }

    if (user.resetTokenExpiry < new Date()) {
      await prisma.customer.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return NextResponse.json(
        { error: "Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới." },
        { status: 400 }
      );
    }

    const isValidCode = await bcrypt.compare(code, user.resetToken);
    if (!isValidCode) {
      return NextResponse.json(
        { error: "Mã xác minh không đúng." },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.customer.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: tokenExpiry,
      },
    });

    return NextResponse.json({
      success: true,
      token,
      message: "Xác minh thành công. Vui lòng tạo mật khẩu mới.",
    });
  } catch (error) {
    console.error("Verify forgot password error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ nội bộ. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
