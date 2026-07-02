import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function randomDisplayRating() {
  const ratings = [4.7, 4.8, 4.9, 5.0];
  return ratings[Math.floor(Math.random() * ratings.length)];
}

function randomReviewCount() {
  return Math.floor(Math.random() * 79) + 18;
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true },
  });

  for (const product of products) {
    await prisma.product.update({
      where: { id: product.id },
      data: {
        displayRating: randomDisplayRating(),
        displayReviewCount: randomReviewCount(),
      },
    });
  }

  console.log(`Updated display ratings for ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
