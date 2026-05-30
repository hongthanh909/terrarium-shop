import { prisma } from "@/lib/prisma";
import { PoliciesClient } from "./PoliciesClient";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  let policies: any[] = [];
  try {
    policies = await prisma.policy.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { id: true, title: true, content: true, type: true, order: true },
    });
  } catch (error) {
    console.error("PoliciesPage: failed to load policies", error);
  }
  return <PoliciesClient policies={policies} />;
}
