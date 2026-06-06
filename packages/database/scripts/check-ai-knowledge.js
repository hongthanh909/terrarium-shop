// Check AI knowledge base status
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

async function main() {
  const entries = await prisma.$queryRawUnsafe(`
    SELECT id, keyword, LEFT(response, 80) as response_preview, category, priority, "isActive"
    FROM "ai_knowledge"
    ORDER BY priority DESC
    LIMIT 5
  `);
  
  console.log("=== AI Knowledge Entries (top 5) ===");
  console.log(JSON.stringify(entries, null, 2));
  
  // Test keyword matching
  const msg = "vận chuyển ntn";
  const lower = msg.toLowerCase();
  console.log(`\n=== Testing message: "${msg}" ===`);
  
  const all = await prisma.$queryRawUnsafe(`
    SELECT keyword, "isActive" FROM "ai_knowledge" WHERE "isActive" = true ORDER BY priority DESC
  `);
  
  let matched = null;
  for (const e of all) {
    if (lower.includes(e.keyword)) {
      matched = e;
      break;
    }
  }
  console.log("Matched keyword:", matched ? matched.keyword : "NONE - will return default");
}

main().catch(console.error).finally(() => prisma.$disconnect());
