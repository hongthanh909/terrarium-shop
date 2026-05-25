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

    const { email } = validated.data;

    const user = await prisma.customer.findUnique({
      where: { email },
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
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    // Send email
    const emailResult = await sendPasswordResetEmail(email, token);
    
    // Check if email was not sent because API KEY is missing (in dev)
    // We still return success to the client so they know to check the logs.
    if (!emailResult.success && emailResult.error === "RESEND_API_KEY is not configured") {
      console.log("Mock email sent. Check console for the reset link.");
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
