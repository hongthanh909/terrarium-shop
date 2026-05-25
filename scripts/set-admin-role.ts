import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.xgblmwclsluvekiwvyxs:WnH5CMLsmVb4wWHK@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres",
    },
  },
});

async function main() {
  const email = "hongthanh181221@gmail.com";

  const updated = await prisma.customer.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  console.log(`✅ Đã set role ADMIN cho: ${updated.email}`);
  console.log(`   Tên: ${updated.name}`);
  console.log(`   Role mới: ${updated.role}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
