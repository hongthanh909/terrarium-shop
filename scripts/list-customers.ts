import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.xgblmwclsluvekiwvyxs:WnH5CMLsmVb4wWHK@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres",
    },
  },
});

async function main() {
  // Liệt kê tất cả customers
  const customers = await prisma.customer.findMany({
    select: { id: true, email: true, name: true, role: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  console.log("=== Danh sách customers trong DB ===");
  customers.forEach((c) => {
    console.log(`  ${c.email} | ${c.name} | ${c.role}`);
  });

  // Tìm theo pattern hongthanh
  const found = await prisma.customer.findMany({
    where: { email: { contains: "hongthanh" } },
  });
  console.log(`\n=== Tìm kiếm "hongthanh": ${found.length} kết quả ===`);
  found.forEach((c) => console.log(`  ${c.email} | ${c.role}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
