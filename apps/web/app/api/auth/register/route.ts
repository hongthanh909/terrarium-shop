import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { z } from "zod";
import { sendRegistrationVerificationEmail } from "@/lib/email";

const registerSchema = z.object({
  email: z.string().email("Email khong hop le"),
  password: z.string().min(6, "Mat khau phai co it nhat 6 ky tu"),
  name: z.string().min(2, "Ten phai co it nhat 2 ky tu").max(100),
  phone: z
    .string()
    .regex(/^[0-9+\s-]{9,15}$/, "So dien thoai khong hop le")
    .optional()
    .nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { password, name, phone } = validated.data;
    const email = validated.data.email.trim().toLowerCase();

    const existing = await prisma.customer.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email nay da duoc su dung" },
        { status: 400 }
      );
    }

    await prisma.pendingRegistration.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const code = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.pendingRegistration.upsert({
      where: { email },
      update: {
        name,
        phone: phone || null,
        passwordHash,
        codeHash,
        expiresAt,
        attempts: 0,
      },
      create: {
        email,
        name,
        phone: phone || null,
        passwordHash,
        codeHash,
        expiresAt,
      },
    });

    const emailResult = await sendRegistrationVerificationEmail(email, code);
    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Khong the gui ma xac minh qua email. Vui long thu lai sau." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email,
      message: "Da gui ma xac minh 6 so den email cua ban",
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Loi may chu noi bo" },
      { status: 500 }
    );
  }
}
