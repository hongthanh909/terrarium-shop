import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  try {
    console.log(`[CLEAR_TEST_DATA] Admin ${admin.email} initiated database clearing.`);

    // 1. Delete all orders (Prisma schema cascade deletes order items, logs, info, tracking, discounts)
    const deleteOrders = await prisma.order.deleteMany({});

    // 2. Delete care items and loyalty points manually (since they do not have onDelete: Cascade in the schema)
    const deleteCareItems = await prisma.customerCareItem.deleteMany({});
    const deletePoints = await prisma.loyaltyPoint.deleteMany({});

    // 3. Delete customers where role is CUSTOMER (cascade deletes addresses, wishlists, reviews, votes)
    const deleteCustomers = await prisma.customer.deleteMany({
      where: { role: "CUSTOMER" }
    });

    console.log(`[CLEAR_TEST_DATA] Success. Orders: ${deleteOrders.count}, Customers: ${deleteCustomers.count}`);

    return NextResponse.json({
      success: true,
      details: {
        orders: deleteOrders.count,
        careItems: deleteCareItems.count,
        loyaltyPoints: deletePoints.count,
        customers: deleteCustomers.count
      }
    });
  } catch (error: any) {
    console.error("[CLEAR_TEST_DATA] Error:", error);
    return NextResponse.json(
      { error: error.message || "Không thể xóa dữ liệu kiểm thử" },
      { status: 500 }
    );
  }
}
