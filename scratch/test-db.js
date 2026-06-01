const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to database...");
  try {
    const start = Date.now();
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log("Success! Query result:", result);
    console.log("Time taken:", Date.now() - start, "ms");
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
