import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const verifyRegisterSchema = z.object({
  email: z.string().email("Email khong hop le"),
  code: z.string().regex(/^\d{6}$/, "Ma xac minh phai gom 6 so"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = verifyRegisterSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const email = validated.data.email.trim().toLowerCase();
    const { code } = validated.data;

    const pending = await prisma.pendingRegistration.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "Khong tim thay yeu cau dang ky. Vui long dang ky lai." },
        { status: 404 }
      );
    }

    if (pending.expiresAt < new Date()) {
      await prisma.pendingRegistration.delete({ where: { id: pending.id } });
      return NextResponse.json(
        { error: "Ma xac minh da het han. Vui long dang ky lai de nhan ma moi." },
        { status: 400 }
      );
    }

    if (pending.attempts >= 5) {
      await prisma.pendingRegistration.delete({ where: { id: pending.id } });
      return NextResponse.json(
        { error: "Ban da nhap sai qua nhieu lan. Vui long dang ky lai." },
        { status: 429 }
      );
    }

    const isValidCode = await bcrypt.compare(code, pending.codeHash);
    if (!isValidCode) {
      await prisma.pendingRegistration.update({
        where: { id: pending.id },
        data: { attempts: { increment: 1 } },
      });

      return NextResponse.json(
        { error: "Ma xac minh khong dung." },
        { status: 400 }
      );
    }

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
      await prisma.pendingRegistration.delete({ where: { id: pending.id } });
      return NextResponse.json(
        { error: "Email nay da duoc su dung." },
        { status: 400 }
      );
    }

    const customer = await prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: {
          email,
          name: pending.name,
          phone: pending.phone,
          passwordHash: pending.passwordHash,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      await tx.pendingRegistration.delete({ where: { id: pending.id } });
      return created;
    });

    return NextResponse.json({
      success: true,
      user: customer,
      message: "Dang ky thanh cong",
    });
  } catch (error) {
    console.error("Verify registration error:", error);
    return NextResponse.json(
      { error: "Loi may chu noi bo" },
      { status: 500 }
    );
  }
}
