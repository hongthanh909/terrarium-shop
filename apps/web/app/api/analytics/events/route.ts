import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { publishAnalyticsUpdate } from "@/lib/analytics-live";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const EVENT_TYPES = [
  "PAGE_VIEW", "PRODUCT_VIEW", "SEARCH", "ADD_TO_CART", "REMOVE_FROM_CART",
  "BEGIN_CHECKOUT", "PURCHASE", "CHAT_OPEN", "CHAT_MESSAGE_SENT", "LOGIN",
  "REGISTER", "HEARTBEAT", "SESSION_END",
] as const;

const primitive = z.union([z.string().max(160), z.number().finite(), z.boolean()]);
const eventSchema = z.object({
  eventKey: z.string().uuid(),
  type: z.enum(EVENT_TYPES),
  path: z.string().trim().min(1).max(500),
  productId: z.string().trim().max(80).optional(),
  searchTerm: z.string().trim().max(120).optional(),
  durationMs: z.number().int().min(0).max(24 * 60 * 60 * 1000).optional(),
  metadata: z.record(primitive).optional(),
});

const requestSchema = z.object({
  anonymousId: z.string().uuid(),
  sessionKey: z.string().uuid(),
  session: z.object({
    entryPath: z.string().trim().min(1).max(500),
    referrer: z.string().max(1000).optional(),
    utmSource: z.string().max(100).optional(),
    utmMedium: z.string().max(100).optional(),
    utmCampaign: z.string().max(100).optional(),
  }),
  events: z.array(eventSchema).min(1).max(20),
});

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_EVENTS = 120;

function isRateLimited(key: string, count: number) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count, resetAt: now + RATE_WINDOW_MS });
    return count > RATE_MAX_EVENTS;
  }
  bucket.count += count;
  return bucket.count > RATE_MAX_EVENTS;
}
function isBot(userAgent: string) {
  return /bot|crawler|spider|slurp|headless|preview|facebookexternalhit/i.test(userAgent);
}

function parseDevice(userAgent: string) {
  const deviceType = /tablet|ipad/i.test(userAgent) ? "tablet" : /mobile|android|iphone/i.test(userAgent) ? "mobile" : "desktop";
  const browser = /edg\//i.test(userAgent) ? "Edge" : /opr\//i.test(userAgent) ? "Opera" : /chrome\//i.test(userAgent) ? "Chrome" : /safari\//i.test(userAgent) ? "Safari" : /firefox\//i.test(userAgent) ? "Firefox" : "Other";
  const operatingSystem = /windows/i.test(userAgent) ? "Windows" : /android/i.test(userAgent) ? "Android" : /iphone|ipad|ios/i.test(userAgent) ? "iOS" : /mac os/i.test(userAgent) ? "macOS" : /linux/i.test(userAgent) ? "Linux" : "Other";
  return { deviceType, browser, operatingSystem };
}

function cleanReferrer(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.slice(0, 500);
  } catch {
    return undefined;
  }
}

function cleanSearchTerm(value?: string) {
  if (!value) return undefined;
  const hasEmail = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/.test(value);
  const hasPhone = /(?:\+?84|0)\d{8,10}/.test(value.replace(/[\s.-]/g, ""));
  return hasEmail || hasPhone ? "[đã ẩn]" : value.slice(0, 120);
}

function cleanMetadata(type: typeof EVENT_TYPES[number], metadata?: Record<string, string | number | boolean>) {
  if (!metadata) return undefined;
  const allowed: Partial<Record<typeof EVENT_TYPES[number], string[]>> = {
    ADD_TO_CART: ["quantity"],
    REMOVE_FROM_CART: ["quantity"],
    BEGIN_CHECKOUT: ["itemCount"],
  };
  const keys = allowed[type] || [];
  const result = Object.fromEntries(keys.filter((key) => metadata[key] !== undefined).map((key) => [key, metadata[key]]));
  return Object.keys(result).length ? result : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get("user-agent") || "";
    if (isBot(userAgent)) return new NextResponse(null, { status: 204 });

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid analytics payload" }, { status: 400 });
    }
    if (isRateLimited(parsed.data.anonymousId, parsed.data.events.length)) {
      return NextResponse.json({ error: "Too many analytics events" }, { status: 429 });
    }

    const authSession = await getServerSession(authOptions);
    const role = (authSession?.user as any)?.role;
    const customerId = authSession?.user && role !== "ADMIN" ? ((authSession.user as any).id as string) : null;
    const now = new Date();
    const pageViewCount = parsed.data.events.filter((event) => event.type === "PAGE_VIEW").length;
    const ended = parsed.data.events.some((event) => event.type === "SESSION_END");
    const latestPath = parsed.data.events[parsed.data.events.length - 1].path;
    const productIds = Array.from(new Set(parsed.data.events.map((event) => event.productId).filter(Boolean))) as string[];

    await prisma.$transaction(async (tx) => {
      const visitor = await tx.analyticsVisitor.upsert({
        where: { anonymousId: parsed.data.anonymousId },
        create: { anonymousId: parsed.data.anonymousId, firstSeenAt: now, lastSeenAt: now },
        update: { lastSeenAt: now },
      });

      let analyticsSession = await tx.analyticsSession.findUnique({ where: { sessionKey: parsed.data.sessionKey } });
      if (analyticsSession && analyticsSession.visitorId !== visitor.id) throw new Error("SESSION_VISITOR_MISMATCH");
      if (!analyticsSession) {
        analyticsSession = await tx.analyticsSession.create({
          data: {
            sessionKey: parsed.data.sessionKey,
            visitorId: visitor.id,
            customerId,
            entryPath: parsed.data.session.entryPath,
            exitPath: latestPath,
            referrer: cleanReferrer(parsed.data.session.referrer),
            utmSource: parsed.data.session.utmSource,
            utmMedium: parsed.data.session.utmMedium,
            utmCampaign: parsed.data.session.utmCampaign,
            ...parseDevice(userAgent),
            pageViews: pageViewCount,
            lastSeenAt: now,
            endedAt: ended ? now : null,
          },
        });
      } else {
        analyticsSession = await tx.analyticsSession.update({
          where: { id: analyticsSession.id },
          data: {
            ...(customerId ? { customerId } : {}),
            exitPath: latestPath,
            lastSeenAt: now,
            endedAt: ended ? now : null,
            pageViews: { increment: pageViewCount },
          },
        });
      }

      const validProducts = productIds.length
        ? new Set((await tx.product.findMany({ where: { id: { in: productIds } }, select: { id: true } })).map((product) => product.id))
        : new Set<string>();

      await tx.analyticsEvent.createMany({
        data: parsed.data.events.map((event) => ({
          eventKey: event.eventKey,
          visitorId: visitor.id,
          analyticsSessionId: analyticsSession!.id,
          customerId,
          eventType: event.type,
          path: event.path,
          productId: event.productId && validProducts.has(event.productId) ? event.productId : null,
          searchTerm: event.type === "SEARCH" ? cleanSearchTerm(event.searchTerm) : null,
          durationMs: event.durationMs,
          metadata: cleanMetadata(event.type, event.metadata),
          createdAt: now,
        })),
        skipDuplicates: true,
      });
    });

    publishAnalyticsUpdate(parsed.data.events.map((event) => event.type));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message === "SESSION_VISITOR_MISMATCH") {
      return NextResponse.json({ error: "Invalid analytics session" }, { status: 409 });
    }
    console.error("Analytics ingestion error:", error);
    return NextResponse.json({ error: "Unable to record analytics" }, { status: 500 });
  }
}
