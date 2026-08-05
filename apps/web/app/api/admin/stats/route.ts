import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { maskEmail } from "@/lib/privacy";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // day | week | month | year | custom
    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");

    const now = new Date();
    let currentStart: Date;
    let currentEnd: Date = new Date();
    let prevStart: Date;
    let prevEnd: Date;
    let labelFormat: "hour" | "day" | "month" = "day";

    if (period === "day") {
      // Today: 00:00:00 to 23:59:59
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      // Previous: Yesterday
      prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      labelFormat = "hour";
    } else if (period === "week") {
      // Last 7 days
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - 6);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      // Previous: 7 days before that
      prevStart = new Date(currentStart);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(currentStart);
      prevEnd.setMilliseconds(-1);
      labelFormat = "day";
    } else if (period === "year") {
      // Current year: Jan 1 to Dec 31
      currentStart = new Date(now.getFullYear(), 0, 1);
      currentEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      // Previous year
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      labelFormat = "month";
    } else if (period === "custom" && customStart && customEnd) {
      currentStart = new Date(customStart);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date(customEnd);
      currentEnd.setHours(23, 59, 59, 999);
      const durationMs = currentEnd.getTime() - currentStart.getTime();
      prevStart = new Date(currentStart.getTime() - durationMs);
      prevEnd = new Date(currentStart.getTime() - 1);
      labelFormat = durationMs > 60 * 24 * 60 * 60 * 1000 ? "month" : "day";
    } else {
      // Default: month (current month vs last month)
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      labelFormat = "day";
    }

    // Batch 1: lightweight global count queries
    const [totalProducts, totalOrders, totalCustomers, pendingOrders, pendingReviews] =
      await Promise.all([
        prisma.product.count({ where: { status: "ACTIVE" } }),
        prisma.order.count(),
        prisma.customer.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.review.count({ where: { approved: false } }),
      ]);

    // Condition for valid revenue orders
    const validRevenueCondition: Prisma.OrderWhereInput = {
      OR: [
        { paymentStatus: "PAID" },
        { paymentMethod: "COD", status: "DELIVERED" },
      ],
    };

    // Batch 2: Aggregations & Orders in current and previous periods
    const [
      currentRevenueAgg,
      prevRevenueAgg,
      currentOrdersCount,
      prevOrdersCount,
      periodOrders,
      recentOrders,
      topProductsRaw,
    ] = await Promise.all([
      // Current Period Revenue
      prisma.order.aggregate({
        where: {
          createdAt: { gte: currentStart, lte: currentEnd },
          ...validRevenueCondition,
        },
        _sum: { total: true },
      }),
      // Previous Period Revenue
      prisma.order.aggregate({
        where: {
          createdAt: { gte: prevStart, lte: prevEnd },
          ...validRevenueCondition,
        },
        _sum: { total: true },
      }),
      // Current Period Order Count
      prisma.order.count({
        where: { createdAt: { gte: currentStart, lte: currentEnd } },
      }),
      // Previous Period Order Count
      prisma.order.count({
        where: { createdAt: { gte: prevStart, lte: prevEnd } },
      }),
      // Orders in current period for breakdown chart
      prisma.order.findMany({
        where: {
          createdAt: { gte: currentStart, lte: currentEnd },
        },
        select: {
          id: true,
          total: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          createdAt: true,
        },
      }),
      // Recent 6 orders
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
          customer: { select: { name: true, email: true } },
        },
      }),
      // Top 5 products by sold quantity
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    // Product Names Lookup for Top Products
    const productIds = topProductsRaw.map((item) => item.productId);
    const productMap = await prisma.product
      .findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, slug: true },
      })
      .then((products) => Object.fromEntries(products.map((p) => [p.id, p])));

    const topProductsWithNames = topProductsRaw.map((item) => ({
      name: productMap[item.productId]?.name || "Sản phẩm không tìm thấy",
      slug: productMap[item.productId]?.slug || "",
      totalSold: item._sum.quantity || 0,
    }));

    // Revenue & Order metrics
    const currentRevenue = Number(currentRevenueAgg._sum?.total || 0);
    const prevRevenue = Number(prevRevenueAgg._sum?.total || 0);
    const revenueChange =
      prevRevenue === 0
        ? currentRevenue > 0
          ? 100
          : 0
        : Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100);

    const ordersChange =
      prevOrdersCount === 0
        ? currentOrdersCount > 0
          ? 100
          : 0
        : Math.round(((currentOrdersCount - prevOrdersCount) / prevOrdersCount) * 100);

    const averageOrderValue = currentOrdersCount > 0 ? Math.round(currentRevenue / currentOrdersCount) : 0;

    // Timeline breakdown construction
    const breakdown: Array<{ label: string; revenue: number; orders: number; date: string }> = [];

    if (labelFormat === "hour") {
      // 24 hours of the day (00:00 to 23:00)
      for (let h = 0; h < 24; h += 2) {
        const hourLabel = `${h.toString().padStart(2, "0")}:00`;
        const hourOrders = periodOrders.filter((o) => {
          const hour = o.createdAt.getHours();
          return hour >= h && hour < h + 2;
        });
        const hourRevenue = hourOrders.reduce((sum, o) => {
          const isValid = o.paymentStatus === "PAID" || (o.paymentMethod === "COD" && o.status === "DELIVERED");
          return sum + (isValid ? Number(o.total) : 0);
        }, 0);

        breakdown.push({
          label: hourLabel,
          revenue: hourRevenue,
          orders: hourOrders.length,
          date: hourLabel,
        });
      }
    } else if (labelFormat === "month") {
      // 12 months (Tháng 1 - Tháng 12)
      for (let m = 0; m < 12; m++) {
        const monthLabel = `T${m + 1}`;
        const monthOrders = periodOrders.filter((o) => o.createdAt.getMonth() === m);
        const monthRevenue = monthOrders.reduce((sum, o) => {
          const isValid = o.paymentStatus === "PAID" || (o.paymentMethod === "COD" && o.status === "DELIVERED");
          return sum + (isValid ? Number(o.total) : 0);
        }, 0);

        breakdown.push({
          label: monthLabel,
          revenue: monthRevenue,
          orders: monthOrders.length,
          date: `Tháng ${m + 1}`,
        });
      }
    } else {
      // Daily breakdown between currentStart and currentEnd
      const startMs = currentStart.getTime();
      const endMs = currentEnd.getTime();
      let curr = new Date(startMs);

      while (curr.getTime() <= endMs) {
        const year = curr.getFullYear();
        const month = curr.getMonth();
        const date = curr.getDate();
        const dayLabel = `${date}/${month + 1}`;

        const dayOrders = periodOrders.filter((o) => {
          const d = o.createdAt;
          return d.getFullYear() === year && d.getMonth() === month && d.getDate() === date;
        });

        const dayRevenue = dayOrders.reduce((sum, o) => {
          const isValid = o.paymentStatus === "PAID" || (o.paymentMethod === "COD" && o.status === "DELIVERED");
          return sum + (isValid ? Number(o.total) : 0);
        }, 0);

        breakdown.push({
          label: dayLabel,
          revenue: dayRevenue,
          orders: dayOrders.length,
          date: `${date}/${month + 1}/${year}`,
        });

        curr.setDate(curr.getDate() + 1);
      }
    }

    return NextResponse.json({
      periodInfo: {
        period,
        startDate: currentStart.toISOString(),
        endDate: currentEnd.toISOString(),
      },
      stats: {
        totalProducts,
        totalOrders,
        totalCustomers,
        pendingOrders,
        pendingReviews,
        thisMonthRevenue: currentRevenue,
        revenueChange,
        currentOrdersCount,
        ordersChange,
        averageOrderValue,
      },
      breakdown,
      recentOrders: recentOrders.map((o) => ({
        ...o,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
        customer: o.customer
          ? {
              ...o.customer,
              email: maskEmail(o.customer.email),
            }
          : o.customer,
      })),
      topProducts: topProductsWithNames,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Lỗi tải thống kê" }, { status: 500 });
  }
}
