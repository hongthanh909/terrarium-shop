import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimiter";
import { sendContactNotification } from "@/lib/email";
import { z } from "zod";

export const dynamic = "force-dynamic";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(160),
  subject: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().min(5).max(5000),
});

export async function GET() {
  try {
    const contactInfo = await prisma.contactInfo.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json(contactInfo);
  } catch (error) {
    console.error("Error fetching contact info:", error);
    return NextResponse.json({ error: "Failed to fetch contact info" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rate = checkRateLimit(`contact:${ip}`, 3, 10 * 60 * 1000);

    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later.", retryAfter: rate.retryAfter },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = contactSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const result = await sendContactNotification(validated.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send contact message" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for your message. We will get back to you soon!",
    }, { status: 201 });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: "Failed to process contact form" },
      { status: 500 }
    );
  }
}
