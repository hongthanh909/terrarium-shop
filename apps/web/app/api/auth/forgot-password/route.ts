import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

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
    });

    // We don't want to leak whether an email exists or not.
    // So if the user doesn't exist, we just return success anyway.
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu.",
      });
    }

    // Generate random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // Token is valid for 1 hour

    // Save token to DB
    await prisma.customer.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    // Send email
    const emailResult = await sendPasswordResetEmail(user.email, token);
    
    if (!emailResult.success) {
      console.error("Forgot password email send failed:", emailResult.error);
      return NextResponse.json(
        { error: "Chưa gửi được email khôi phục. Vui lòng thử lại sau hoặc liên hệ shop." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ nội bộ. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
