import { prisma } from "@/lib/prisma";
import { PoliciesClient } from "./PoliciesClient";

export const revalidate = 3600; // Cache 1 giờ

export default async function PoliciesPage() {
  const policies = await prisma.policy.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      order: true,
    },
  });

  return <PoliciesClient policies={policies} />;
}
