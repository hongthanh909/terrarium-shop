import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";


export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone } = await request.json();
    
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ các trường bắt buộc" }, { status: 400 });
    }

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
