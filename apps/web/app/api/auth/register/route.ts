import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(100),
  phone: z.string().regex(/^[0-9+\s-]{9,15}$/, "Số điện thoại không hợp lệ").optional().nullable(),
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

    const { email, password, name, phone } = validated.data;


    const existing = await prisma.customer.findUnique({
      where: { email }
    });

    if (existing) {
      return NextResponse.json({ error: "Email này đã được sử dụng" }, { status: 400 });
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newCustomer = await prisma.customer.create({
      data: {
        email,
        name,
        phone: phone || null,
        passwordHash, // Securely hashed
      }
    });

    return NextResponse.json({
      id: newCustomer.id,
      email: newCustomer.email,
      name: newCustomer.name,
      role: newCustomer.role,
      message: "Đăng ký thành công"
    });

  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ" }, { status: 500 });
  }
}
