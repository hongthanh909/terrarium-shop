const { PrismaClient } = require("@prisma/client");

async function main() {
  console.log("Connecting to database...");
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || "postgresql://postgres.xgblmwclsluvekiwvyxs:WnH5CMLsmVb4wWHK@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
      }
    }
  });

  try {
    console.log("Running Batch 1...");
    const [totalProducts, totalOrders, totalCustomers, pendingOrders, pendingReviews] =
      await Promise.all([
        prisma.product.count({ where: { status: "ACTIVE" } }),
        prisma.order.count(),
        prisma.customer.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.review.count({ where: { approved: false } }),
      ]);
    console.log("Batch 1 completed successfully:", {
      totalProducts,
      totalOrders,
      totalCustomers,
      pendingOrders,
      pendingReviews
    });

    console.log("Running Batch 2...");
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [monthOrders, lastMonthOrders, recentOrders, topProducts] = await Promise.all([
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
          OR: [
            { paymentStatus: "PAID" },
            { paymentMethod: "COD", status: "DELIVERED" },
          ],
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          OR: [
            { paymentStatus: "PAID" },
            { paymentMethod: "COD", status: "DELIVERED" },
          ],
        },
        _sum: { total: true },
      }),
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
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    console.log("Batch 2 completed successfully.");
    console.log("Top products raw:", topProducts);

    console.log("Fetching product names...");
    const topProductsWithNames = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, slug: true },
        });
        return {
          name: product?.name || "Sản phẩm không tìm thấy",
          slug: product?.slug || "",
          totalSold: item._sum.quantity || 0,
        };
      })
    );
    console.log("Top products with names:", topProductsWithNames);

  } catch (error) {
    console.error("CRITICAL ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
