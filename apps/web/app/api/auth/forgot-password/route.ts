import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { sendPasswordResetCodeEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = forgotPasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const email = validated.data.email.trim().toLowerCase();

    const user = await prisma.customer.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Email này chưa được đăng ký tài khoản. Vui lòng đăng ký mới hoặc kiểm tra lại email.",
          code: "ACCOUNT_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const code = randomInt(100000, 1000000).toString();
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.customer.update({
      where: { id: user.id },
      data: {
        resetToken: codeHash,
        resetTokenExpiry: expiry,
      },
    });

    const emailResult = await sendPasswordResetCodeEmail(user.email, code);

    if (!emailResult.success) {
      console.error("Forgot password code email send failed:", emailResult.error);
      return NextResponse.json(
        { error: "Chưa gửi được mã xác minh. Vui lòng thử lại sau hoặc liên hệ shop." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      email: user.email,
      message: "Đã gửi mã xác minh 6 số. Vui lòng kiểm tra hộp thư và mục Spam.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ nội bộ. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
