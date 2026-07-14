import { randomUUID } from "crypto";
import { publishAnalyticsUpdate } from "@/lib/analytics-live";
import { prisma } from "@/lib/prisma";

export async function recordPurchaseEvent(input: {
  anonymousId?: string;
  sessionKey?: string;
  customerId?: string | null;
  orderId: string;
}) {
  if (!input.anonymousId || !input.sessionKey) return;
  try {
    const visitor = await prisma.analyticsVisitor.findUnique({ where: { anonymousId: input.anonymousId } });
    const session = await prisma.analyticsSession.findUnique({ where: { sessionKey: input.sessionKey } });
    if (!visitor || !session || session.visitorId !== visitor.id) return;
    await prisma.analyticsEvent.create({
      data: {
        eventKey: randomUUID(),
        visitorId: visitor.id,
        analyticsSessionId: session.id,
        customerId: input.customerId || session.customerId,
        eventType: "PURCHASE",
        path: "/checkout/success",
        metadata: { orderId: input.orderId },
      },
    });
    publishAnalyticsUpdate(["PURCHASE"]);
  } catch (error) {
    console.warn("Purchase analytics was not recorded:", error);
  }
}
