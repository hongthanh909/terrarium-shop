const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || "postgresql://postgres.xgblmwclsluvekiwvyxs:WnH5CMLsmVb4wWHK@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
      }
    }
  });

  try {
    console.log("Fetching products like API does...");
    const products = await prisma.product.findMany({
      where: {}, // empty filters for status=all
      include: {
        category: true,
        variants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
    });
    console.log("Success! Fetched products count:", products.length);
    if (products.length > 0) {
      console.log("First product:", JSON.stringify(products[0], null, 2));
    }
  } catch (error) {
    console.error("API GET QUERY FAILED:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
