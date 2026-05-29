import { prisma } from "@/lib/prisma";
import { PoliciesClient } from "./PoliciesClient";
import { unstable_cache } from "next/cache";

// Cache 1 giờ — nội dung chính sách rất ít thay đổi
export const revalidate = 3600;

const getCachedPolicies = unstable_cache(
  async () => {
    return prisma.policy.findMany({
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
  },
  ["policies-data"],
  { revalidate: 3600 }
);

export default async function PoliciesPage() {
  const policies = await getCachedPolicies();
  return <PoliciesClient policies={policies} />;
}
