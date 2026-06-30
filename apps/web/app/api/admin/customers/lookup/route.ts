import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminRequest(request);

  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Missing email query parameter" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        passwordHash: true,
        resetToken: true,
        resetTokenExpiry: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!customer) {
      return NextResponse.json({
        exists: false,
        email,
        table: "customers",
        model: "Customer",
      });
    }

    return NextResponse.json({
      exists: true,
      table: "customers",
      model: "Customer",
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        role: customer.role,
        hasPassword: Boolean(customer.passwordHash),
        hasResetToken: Boolean(customer.resetToken),
        resetTokenExpiry: customer.resetTokenExpiry,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
    });
  } catch (error) {
    console.error("Admin customer lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
