const fs = require('fs');
const path = require('path');

// Manually load env variables from .env and .env.local
function loadEnv(envPath) {
  if (fs.existsSync(envPath)) {
    console.log(`Loading env variables from ${path.basename(envPath)}`);
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split(/\r?\n/).forEach(line => {
      // Ignore comments and empty lines
      if (!line || line.trim().startsWith('#')) return;
      
      const equalIndex = line.indexOf('=');
      if (equalIndex > 0) {
        const key = line.substring(0, equalIndex).trim();
        let val = line.substring(equalIndex + 1).trim();
        
        // Remove enclosing quotes if any
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        
        process.env[key] = val;
      }
    });
  }
}

// Load root or local envs
loadEnv(path.join(__dirname, '../.env'));
loadEnv(path.join(__dirname, '../.env.local'));

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not defined in .env or .env.local!");
  process.exit(1);
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting to clear test data...");

  // 1. Delete all orders (this will cascade delete order items, status logs, discounts, shipping info/trackings)
  const deleteOrdersCount = await prisma.order.deleteMany({});
  console.log(`Deleted ${deleteOrdersCount.count} orders.`);

  // 2. Delete CustomerCareItem and LoyaltyPoint records manually (no cascade onDelete in schema)
  const deleteCareItemsCount = await prisma.customerCareItem.deleteMany({});
  console.log(`Deleted ${deleteCareItemsCount.count} customer care items.`);

  const deletePointsCount = await prisma.loyaltyPoint.deleteMany({});
  console.log(`Deleted ${deletePointsCount.count} loyalty points.`);

  // 3. Delete non-admin customers (role = CUSTOMER) - will cascade delete their addresses, wishlists, reviews, votes, blog comments/likes/replies
  const deleteCustomersCount = await prisma.customer.deleteMany({
    where: {
      role: 'CUSTOMER'
    }
  });
  console.log(`Deleted ${deleteCustomersCount.count} customers.`);

  console.log("Database cleared successfully!");
}

main()
  .catch((e) => {
    console.error("Error clearing database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
